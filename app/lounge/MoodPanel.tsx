'use client';
// 무드 패널 (U): big face and number, the four needs, the thoughts with their
// timers, the inspiration gauge, "이러면 나아져요", things to do right now
// (간식 · 침대 · 바 음료 · 촌장님 찻잔) and the friends' faces with 응원하기.
// Keyboard-first: every control is a button in reading order, U or Esc closes.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  CHEER_HOWS,
  CHEER_LABEL,
  COZY_TIERS,
  DRINKS_PER_DAY,
  INSPIRATIONS,
  MOODLETS,
  MOOD_TIER_BY_ID,
  REST_GAIN,
  SNACKS_PER_DAY,
  type CheerHow,
  type MoodletId,
} from '../lounge-mood-data';
import { moodLine, moodTips, signed, snackPick, timeLeft, type MoodTip } from '../lounge-mood-ui';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { keyLabel } from '../lounge-keybinds';
import { useSettings } from '../lounge-settings';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import { MoodFaceIcon, MoodGlyph, NEED_ICON } from './mood-glyphs';
import { MoodShareToggle } from './MoodHud';
import type { Notify } from './Toast';
import './mood.css';

/** Thoughts that belong to 바깥바람 and 성취 (the two summary lines). */
const OUTSIDE: MoodletId[] = ['sunny', 'rain', 'storm', 'snow'];
const ACHIEVE: MoodletId[] = ['gold', 'rareFish', 'best', 'dex', 'donate', 'levelUp', 'request', 'house', 'furniture'];

export function MoodPanel({
  room,
  view,
  notify,
  onClose,
  onTip,
  onSticker,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  /** A tip's button that leads elsewhere (invite a friend, visit, talk, fish). */
  onTip?: (tip: MoodTip) => void;
  /** 스티커 응원: play the 나이스! sticker where I stand (the live reaction). */
  onSticker?: () => void;
}) {
  const life = view.life;
  const m = life?.mood;
  const [settings] = useSettings();
  const [run, busy] = useLifeAction(room, notify);
  const now = useNow(true, 15_000) + view.clockOffset;
  const [cheering, setCheering] = useState<number | null>(null);
  const [snackId, setSnackId] = useState<string>('');
  const body = useRef<HTMLDivElement>(null);
  // U (the same key that opened it) closes it again, also when focus fell to
  // the page (a button that turned disabled while pressed).
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== settings.keys.mood || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.defaultPrevented) return;
      const mine = body.current?.closest('dialog');
      // Only when this panel is the top dialog.
      if (!mine || [...document.querySelectorAll('dialog[open]')].at(-1) !== mine) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t?.closest('input:not([type=checkbox]), textarea, select')) return;
      e.preventDefault();
      close.current();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [settings.keys.mood]);
  const me = view.players.find((p) => p.id === view.self);
  const online = useMemo(
    () => view.players.filter((p) => p.id !== view.self && !p.id.startsWith('friend-')).map((p) => p.actor),
    [view.players, view.self],
  );
  if (!life || !m)
    return (
      <Modal title="기분" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 기분을 볼 수 있어요.</p>
      </Modal>
    );
  const tier = MOOD_TIER_BY_ID[m.tier];
  const bag = life.me.bag;
  const inv = life.me.inv ?? {};
  const snacks = snackOptions(bag.produce, bag.fruit, inv);
  const pick = snacks.find((s) => s.id === snackId) ?? (snackPick(bag.produce, bag.fruit, inv) ? snacks.find((s) => s.id === snackPick(bag.produce, bag.fruit, inv)!.id) : undefined) ?? snacks[0];
  const tips = moodTips({ mood: m, produce: bag.produce, fruit: bag.fruit, inv, ate: !!life.me.ate, online, now });
  const atBar = me?.area === 'casino' || me?.area === 'tavern';
  const restWait = m.restAt > now;
  const outside = m.lets.filter((l) => OUTSIDE.includes(l.id)).reduce((s, l) => s + l.value, 0);
  const achieve = m.lets.filter((l) => ACHIEVE.includes(l.id)).reduce((s, l) => s + l.value, 0);
  const gaugePct = m.insp ? 100 : Math.round((m.gauge / m.gaugeMax) * 100);
  const weekFull = m.week >= m.weekMax;
  const eatSnack = async (id: string) => {
    const s = snacks.find((x) => x.id === id);
    if (!s) return;
    const ok = await run({ kind: 'snack', item: s.id, ...(s.q !== undefined ? { q: s.q } : {}) }, `${josa(s.name, '을/를')} 간식으로 먹었어요. 배부름 +${s.dish ? 40 : 25}`);
    if (ok) lifeSfx('eat');
  };
  const rest = async () => {
    const ok = await run({ kind: 'bedRest' }, `폭신한 침대에서 잠깐 쉬었어요. 휴식 +${REST_GAIN}`);
    if (ok) lifeSfx('sip');
  };
  const drink = async () => {
    const ok = await run({ kind: 'barDrink' }, m.drinkPrice ? `시원한 한 잔! ${formatBeom(m.drinkPrice)}을 냈어요.` : '오늘의 첫 잔은 바에서 대접해요. 시원해요!');
    if (ok) lifeSfx('sip');
  };
  const tea = async () => {
    const ok = await run({ kind: 'moodTea' }, '촌장님의 따뜻한 차를 마셨어요. 마음이 포근해져요.');
    if (ok) lifeSfx('sip');
  };
  const cheer = async (actor: number, how: CheerHow) => {
    const snack = how === 'snack' ? pick : undefined;
    if (how === 'snack' && !snack) return notify('건넬 간식이 가방에 없어요.', 'error');
    const ok = await run(
      { kind: 'cheer', to: actor, how, ...(snack ? { item: snack.id } : {}) },
      `${ACTORS[actor]}에게 ${CHEER_LABEL[how]}! 응원을 보냈어요.`,
    );
    if (ok) {
      lifeSfx('cheer');
      if (how === 'sticker') onSticker?.();
      setCheering(null);
    }
  };
  const runTip = (tip: MoodTip) => {
    if (tip.action === 'snack' && tip.item) return void eatSnack(tip.item);
    if (tip.action === 'eat' && tip.item) return void run({ kind: 'eat', item: tip.item }, '맛있게 먹었어요!');
    if (tip.action === 'rest') return void rest();
    if (tip.action === 'drink') return void drink();
    if (tip.action === 'tea') return void tea();
    if (tip.action === 'cheer' && tip.actor !== undefined) return setCheering(tip.actor);
    onTip?.(tip);
  };
  const others = [0, 1, 2, 3, 4, 5, 6].filter((a) => a !== me?.actor && a !== (life.actors[view.self] ?? -1));
  return (
    <Modal title="기분" onClose={onClose} className="l-mood-modal" wide>
      <div ref={body} className="l-mood-panel" data-testid="mood-panel" data-tier={m.tier} style={{ ['--mood-c' as string]: tier.color }}>
        <header className="l-mood-head">
          <span className="l-mood-bigface">
            <MoodFaceIcon tier={m.tier} size={76} />
          </span>
          <span className="l-mood-headtext">
            <small>지금 기분</small>
            <strong>
              {tier.name} <b>{m.v}</b>
            </strong>
            <em>{moodLine(m)}</em>
          </span>
          <span className="l-mood-xp" data-up={m.xp > 1 || undefined} data-down={m.xp < 1 || undefined}>
            기술 XP
            <b>{m.xp === 1 ? '보통' : `${m.xp > 1 ? '+' : '−'}${Math.round(Math.abs(m.xp - 1) * 100)}%`}</b>
            <small>{(m.xpCap ?? 1) > 1 ? `하루 XP 한도 +${Math.round(((m.xpCap ?? 1) - 1) * 100)}% · 범은 그대로` : '범에는 영향 없어요'}</small>
          </span>
        </header>

        <div className="l-mood-grid">
          <section className="l-mood-card" aria-labelledby="mood-needs">
            <h3 id="mood-needs">욕구</h3>
            <ul className="l-mood-needs">
              {m.needs.map((n) => (
                <li key={n.id} data-low={n.value < 30 || undefined}>
                  <MoodGlyph name={NEED_ICON[n.id]} size={20} />
                  <span className="l-mood-need-name">{n.name}</span>
                  <span className="l-mood-bar" aria-hidden="true">
                    <i style={{ width: `${n.value}%` }} />
                  </span>
                  <span className="sr-only">{n.value}/100</span>
                  <span className="l-mood-need-word">{n.word}</span>
                  <b data-sign={n.offset < 0 ? 'neg' : n.offset > 0 ? 'pos' : undefined}>{n.offset ? signed(n.offset) : '·'}</b>
                </li>
              ))}
            </ul>
            <ul className="l-mood-extra">
              <li>
                <MoodGlyph name="sofa" size={18} />
                <span>아늑함</span>
                <span>{m.cozy ? `${m.cozy.name} · 방 점수 ${m.cozy.score}` : '내 방을 꾸미면 아늑해져요'}</span>
                <b data-sign={m.cozy?.value ? 'pos' : undefined}>{m.cozy?.value ? signed(m.cozy.value) : '·'}</b>
              </li>
              <li>
                <MoodGlyph name="sun" size={18} />
                <span>바깥바람</span>
                <span>{outside ? (outside > 0 ? '상쾌해요' : '궂은 날씨') : '날씨 따라 달라져요'}</span>
                <b data-sign={outside < 0 ? 'neg' : outside > 0 ? 'pos' : undefined}>{outside ? signed(outside) : '·'}</b>
              </li>
              <li>
                <MoodGlyph name="up" size={18} />
                <span>성취</span>
                <span>{achieve ? '뿌듯해요' : '금별·레벨 업·기증으로 채워요'}</span>
                <b data-sign={achieve ? 'pos' : undefined}>{achieve ? signed(achieve) : '·'}</b>
              </li>
            </ul>
            {m.cozy === null && (
              <p className="l-mood-note">
                방 점수 단계: {COZY_TIERS.slice().reverse().map((t) => `${t.name} ${t.min}+`).join(' · ')}
              </p>
            )}
          </section>

          <section className="l-mood-card" aria-labelledby="mood-lets">
            <h3 id="mood-lets">
              생각 <small>{m.lets.length ? `${m.lets.length}가지` : '아직 없어요'}</small>
            </h3>
            {m.lets.length ? (
              <ul className="l-mood-lets" data-testid="mood-lets">
                {m.lets.map((l) => {
                  const total = MOODLETS[l.id].ms,
                    left = Math.max(0, l.until - now);
                  return (
                    <li key={l.id} data-sign={l.value < 0 ? 'neg' : 'pos'}>
                      <MoodGlyph name={l.icon} size={20} />
                      <span className="l-mood-let-name">
                        {l.name}
                        {l.stacks > 1 && <small> ×{l.stacks}</small>}
                      </span>
                      <b>{signed(l.value)}</b>
                      <span className="l-mood-timer" aria-label={`${timeLeft(l.until, now)} 남음`}>
                        <i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
                      </span>
                      <small className="l-mood-left">{timeLeft(l.until, now)}</small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="l-mood-note">친구와 한 판, 맛있는 식사, 금별 수확 같은 일이 생각으로 남아요.</p>
            )}
            {m.capped && <p className="l-mood-note">안 좋은 생각은 아무리 겹쳐도 −15까지만 영향을 줘요.</p>}
          </section>

          <section className="l-mood-card l-mood-insp-card" aria-labelledby="mood-insp">
            <h3 id="mood-insp">영감</h3>
            <div className="l-mood-gauge-row">
              <span className="l-mood-ring" aria-hidden="true" style={{ ['--p' as string]: gaugePct }}>
                <MoodGlyph name="spark" size={26} />
              </span>
              <span className="sr-only">영감 게이지 {gaugePct}%</span>
              <span className="l-mood-gauge-text">
                <strong>
                  이번 주 {m.week}/{m.weekMax}
                </strong>
                <small>
                  {m.insp
                    ? '들고 있는 영감을 먼저 써요'
                    : weekFull
                      ? '이번 주 영감을 다 받았어요. 월요일에 다시 차요.'
                      : m.todayDone
                        ? '오늘 영감은 받았어요. 내일 또 차요.'
                        : m.v > 65
                          ? '기분이 좋아서 게이지가 차고 있어요'
                          : '기분이 65를 넘으면 게이지가 차요'}
                </small>
              </span>
            </div>
            {m.insp ? (
              <div className="l-mood-held" data-testid="mood-held">
                <MoodGlyph name={INSPIRATIONS[m.insp.k].icon} size={26} />
                <span>
                  <strong>{m.insp.name}</strong>
                  <small>{m.insp.text}</small>
                  <em>
                    {m.insp.k === 'learn' ? '' : `${m.insp.left}번 남음 · `}
                    {timeLeft(m.insp.until, now)} 동안
                  </em>
                </span>
              </div>
            ) : (
              <p className="l-mood-note">풍작 영감은 다음 수확 한 판을, 입질 영감은 낚시 10번을 더 좋게 해 줘요. 오늘 가장 많이 한 기술을 따라 정해져요.</p>
            )}
          </section>

          <section className="l-mood-card l-mood-tips" aria-labelledby="mood-tips">
            <h3 id="mood-tips">이러면 나아져요</h3>
            <ul>
              {tips.map((t) => (
                <li key={t.key}>
                  <span>
                    <strong>{t.text}</strong>
                    <small>{t.why}</small>
                  </span>
                  {t.action !== 'none' && (
                    <button type="button" className="l-mood-go" disabled={busy || (t.action === 'drink' && !atBar)} onClick={() => runTip(t)} title={t.action === 'drink' && !atBar ? '카지노나 주점의 바에서 마실 수 있어요' : undefined}>
                      {TIP_LABEL[t.action]}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="l-mood-card l-mood-do" aria-labelledby="mood-do">
          <h3 id="mood-do">지금 할 수 있는 것</h3>
          <div className="l-mood-actions">
            <div className="l-mood-action">
              <MoodGlyph name="bowl" size={22} />
              <span>
                <strong>간식 먹기</strong>
                <small>
                  배부름 +25 · 요리 +40 · 오늘 {m.snacksLeft}/{SNACKS_PER_DAY}번 남음
                </small>
              </span>
              <select aria-label="간식 고르기" value={pick?.id ?? ''} onChange={(e) => setSnackId(e.target.value)} disabled={!snacks.length}>
                {snacks.length ? (
                  snacks.map((s) => (
                    <option key={s.id + (s.q ?? '')} value={s.id}>
                      {s.name} ({s.n})
                    </option>
                  ))
                ) : (
                  <option value="">가방에 간식이 없어요</option>
                )}
              </select>
              <button type="button" className="l-leaf" data-testid="mood-snack" disabled={busy || !pick || !m.snacksLeft} onClick={() => pick && void eatSnack(pick.id)}>
                먹기
              </button>
            </div>
            <div className="l-mood-action">
              <MoodGlyph name="moon" size={22} />
              <span>
                <strong>침대에서 쉬기</strong>
                <small>{restWait ? `${timeLeft(m.restAt, now)} 뒤에 다시 쉴 수 있어요` : `휴식 +${REST_GAIN} · 한 시간에 한 번`}</small>
              </span>
              <button type="button" className="l-leaf" data-testid="mood-rest" disabled={busy || restWait} onClick={() => void rest()}>
                쉬기
              </button>
            </div>
            <div className="l-mood-action">
              <MoodGlyph name="cup" size={22} />
              <span>
                <strong>바 음료</strong>
                <small>
                  {atBar ? '' : '카지노·주점 바에서 · '}
                  {m.drinkPrice ? `${formatBeom(m.drinkPrice)}` : '오늘 첫 잔 무료'} · 배부름 +20 · 오늘 {m.drinks}/{DRINKS_PER_DAY}잔
                </small>
              </span>
              <button type="button" className="l-leaf" data-testid="mood-drink" disabled={busy || !atBar || !m.drinksLeft} onClick={() => void drink()}>
                {m.drinkPrice ? '사 마시기' : '받기'}
              </button>
            </div>
            {m.cup && (
              <div className="l-mood-action is-cup" data-testid="mood-cup">
                <MoodGlyph name="cup" size={22} />
                <span>
                  <strong>촌장님 찻잔</strong>
                  <small>“요즘 힘들어 보여서요. 따뜻할 때 드세요.” — 촌장</small>
                </span>
                <button type="button" className="l-leaf" disabled={busy} onClick={() => void tea()}>
                  마시기
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="l-mood-card l-mood-friends" aria-labelledby="mood-friends">
          <h3 id="mood-friends">
            친구들 <small>표정만 보여요 · 응원은 친구마다 하루 한 번</small>
          </h3>
          <ul>
            {others.map((a) => {
              const face = m.faces[a];
              const done = m.cheered.includes(a);
              return (
                <li key={a} data-away={face?.away || !face || undefined}>
                  <span className="l-mood-friend-face">
                    {face ? <MoodFaceIcon tier={face.tier} size={34} /> : <MoodFaceIcon tier="ok" size={34} className="is-unknown" />}
                    {face?.insp && <MoodGlyph name="spark" size={12} className="l-mood-friend-spark" />}
                  </span>
                  <span className="l-mood-friend-text">
                    <strong>{ACTORS[a]}</strong>
                    <small>
                      {face ? MOOD_TIER_BY_ID[face.tier].name : '아직 몰라요'}
                      {face?.away ? ' · 쉬는 중' : online.includes(a) ? ' · 접속 중' : ''}
                    </small>
                    {face?.top && <small className="l-mood-friend-top">{face.top.map((t) => `${t.name} ${signed(t.value)}`).join(' · ')}</small>}
                  </span>
                  {cheering === a ? (
                    <span className="l-mood-cheer-menu">
                      {CHEER_HOWS.map((how) => (
                        <button key={how} type="button" disabled={busy || (how === 'snack' && !pick)} onClick={() => void cheer(a, how)}>
                          {CHEER_LABEL[how]}
                        </button>
                      ))}
                      <button type="button" onClick={() => setCheering(null)} aria-label="응원 그만두기">
                        취소
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="l-mood-cheer"
                      data-testid={`mood-cheer-${a}`}
                      disabled={busy || done || !face || !life.actors || !Object.values(life.actors).includes(a)}
                      onClick={() => setCheering(a)}
                    >
                      <MoodGlyph name="heart" size={15} />
                      {done ? '응원했어요' : '응원하기'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <MoodShareToggle room={room} life={life} />
        </section>
        <p className="l-mood-foot">
          기분은 체력이 아니에요. 아무리 낮아도 막히는 일은 없고, 범(가격·보상·판돈)에도 영향이 없어요. 접속하지 않은 시간은 푹 자는 시간이에요.
          <kbd>{keyLabel(settings.keys.mood)}</kbd> 또는 <kbd>Esc</kbd>로 닫아요.
        </p>
      </div>
    </Modal>
  );
}

const TIP_LABEL: Record<MoodTip['action'], string> = {
  snack: '먹기',
  eat: '먹기',
  rest: '쉬기',
  drink: '한 잔',
  tea: '마시기',
  talk: '말 걸러',
  invite: '초대하기',
  visit: '놀러 가기',
  cheer: '응원하기',
  fish: '가 볼래요',
  none: '',
};

type SnackOption = { id: string; name: string; n: number; q?: 0 | 1 | 2; dish?: boolean };
function snackOptions(produce: Record<string, number>, fruit: number, inv: Record<string, number>): SnackOption[] {
  const out: SnackOption[] = [];
  const best = snackPick(produce, fruit, inv);
  for (const [id, n] of Object.entries(produce)) if (n > 0) out.push({ id, name: cropName(id), n });
  if (fruit > 0) out.push({ id: 'fruit', name: '과일', n: fruit });
  for (const [id, n] of Object.entries(inv)) {
    const s = n > 0 ? snackPick({}, 0, { [id]: n }) : null;
    if (s) out.push({ id, name: s.name, n, dish: s.value >= 10_000 });
  }
  // The cheapest first (what the tips would suggest).
  return out.sort((a, b) => (a.id === best?.id ? -1 : b.id === best?.id ? 1 : 0));
}
function cropName(id: string) {
  const p = snackPick({ [id]: 1 } as never, 0, {});
  return p?.name ?? id;
}
