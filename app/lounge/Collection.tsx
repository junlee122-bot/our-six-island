'use client';
// 도감 (K): fish / bugs / forage / crops / dishes with silhouettes for what I
// have not found yet, the village museum (donations and first donors) and
// achievements with progress bars. The museum pavilion in the village opens
// this book on its 박물관 tab.
import { useState } from 'react';
import { Award, BookOpen, Check, Landmark, Lock, MapPin, Trophy } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROP_INFO, type Crop } from '../lounge-life';
import { FISH_BY_ID, ITEM_BY_ID } from '../lounge-items';
import { FIRST_DONATION_GRANT } from '../lounge-life-plus';
import { CO_DONATION_GRANT, MUSEUM_MILESTONES } from '../lounge-social-defs';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { DEX_TABS, MUSEUM_IDS, achievementRows, needHave, whereFrom, type DexTab } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { useLifeAction } from './LifePanels';
import './life-plus.css';

export type BookTab = DexTab | 'museum' | 'achievements';
const nameOf = (id: string) => (CROP_INFO[id as Crop]?.name ?? ITEM_BY_ID[id]?.name ?? id);
const dateText = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};

export function CollectionBook({
  room,
  view,
  notify,
  onClose,
  initialTab = 'fish',
  atMuseum = false,
  onGo,
  selfActor = -1,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  initialTab?: BookTab;
  /** Opened at the museum pavilion: donations are possible here. */
  atMuseum?: boolean;
  /** "박물관으로 가기": walk to the pavilion. */
  onGo?: () => void;
  /** My actor (my stamps and stats). */
  selfActor?: number;
}) {
  const life = view.life;
  const [tab, setTab] = useState<BookTab>(initialTab);
  const [picked, setPicked] = useState<string | null>(null);
  const [run, busy] = useLifeAction(room, notify);
  if (!life)
    return (
      <Modal title="도감" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 도감을 볼 수 있어요.</p>
      </Modal>
    );
  const dex = new Set(life.me.dex ?? []);
  const museum = life.museum ?? {};
  const total = DEX_TABS.reduce((s, [, , ids]) => s + ids.length, 0);
  const found = DEX_TABS.reduce((s, [, , ids]) => s + ids.filter((id) => dex.has(id)).length, 0);
  const donatedCount = MUSEUM_IDS.filter((id) => museum[id]).length;
  const mult = life.flags?.includes('museum') ? 2 : 1;
  // C-5 co-donation: everyone may stamp each item once; the first donor keeps the honor.
  const donors = life.social?.museum.donors ?? {};
  const mine = new Set(life.social?.museum.mine ?? Object.keys(museum).filter((id) => museum[id].actor === selfActor));
  const donate = async (id: string) => {
    const first = !museum[id];
    const ok = await run(
      { kind: 'donate', item: id },
      first
        ? `${josa(nameOf(id), '을/를')} 박물관에 처음으로 기증했어요! 첫 기증자로 이름이 남아요. +${formatBeom(FIRST_DONATION_GRANT * mult)}`
        : `${nameOf(id)} 칸에 내 기증 도장을 찍었어요. +${formatBeom(CO_DONATION_GRANT * mult)}`,
    );
    if (ok) lifeSfx('donate');
  };
  const tabs: [BookTab, string][] = [
    ...DEX_TABS.map(([id, label]) => [id, label] as [BookTab, string]),
    ['museum', '박물관'],
    ['achievements', '업적'],
  ];
  const detail = picked ? (
    <aside className="l-dex-detail" data-testid="dex-detail">
      <ItemIcon id={picked} size={72} className={dex.has(picked) ? '' : 'is-unknown'} />
      <strong>{dex.has(picked) ? nameOf(picked) : '???'}</strong>
      <small>{whereFrom(picked)}</small>
      {dex.has(picked) && ITEM_BY_ID[picked]?.note && <p className="l-help-text">{ITEM_BY_ID[picked].note}</p>}
      {FISH_BY_ID[picked] && life.records?.[picked] && (
        <p className="l-dex-record">
          <Trophy size={13} aria-hidden="true" /> 마을 최대어 {life.records[picked].cm}cm · {ACTORS[life.records[picked].actor] ?? '친구'}
        </p>
      )}
      {museum[picked] ? (
        <>
          <p className="l-dex-museum">
            <Landmark size={13} aria-hidden="true" /> 첫 기증자 {ACTORS[museum[picked].actor] ?? '친구'} · {dateText(museum[picked].at)}
          </p>
          {(donors[picked]?.length ?? 0) > 1 && (
            <p className="l-help-text" data-testid="dex-donors">
              함께 기증한 친구 · {donors[picked].slice(1).map((a) => ACTORS[a] ?? '친구').join(', ')}
            </p>
          )}
        </>
      ) : (
        <p className="l-help-text">아직 박물관에 없어요.</p>
      )}
    </aside>
  ) : (
    <aside className="l-dex-detail">
      <p className="l-help-text">칸을 클릭하면 어디서 만나는지, 누가 처음 기증했는지 볼 수 있어요.</p>
    </aside>
  );
  return (
    <Modal title={atMuseum ? '마을 박물관' : '도감'} onClose={onClose} className="l-life-modal l-book" wide>
      <p className="l-modal-intro">
        <BookOpen size={15} aria-hidden="true" /> 도감 <b data-testid="dex-count">{found}/{total}</b> · 박물관 기증{' '}
        <b>{donatedCount}/{MUSEUM_IDS.length}</b>
        {!atMuseum && onGo && (
          <button type="button" className="l-link" onClick={onGo}>
            <MapPin size={13} /> 박물관으로 가기
          </button>
        )}
      </p>
      <div className="l-mail-tabs l-inv-tabs" role="tablist" aria-label="도감">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setPicked(null);
            }}
            data-testid={`book-tab-${id}`}
          >
            {label}
            {id !== 'museum' && id !== 'achievements' && (
              <small>
                {DEX_TABS.find(([t]) => t === id)![2].filter((x) => dex.has(x)).length}/{DEX_TABS.find(([t]) => t === id)![2].length}
              </small>
            )}
          </button>
        ))}
      </div>
      {tab === 'achievements' ? (
        <ul className="l-achievements" data-testid="achievements">
          {achievementRows(life.me).map((a) => (
            <li key={a.id} data-done={a.done || undefined}>
              <span className="l-ach-icon" aria-hidden="true">
                {a.done ? <Award size={22} /> : <Lock size={18} />}
              </span>
              <span className="l-ach-text">
                <strong>{a.name}</strong>
                <small>{a.text}</small>
                <progress max={a.goal} value={a.progress} aria-label={`${a.name} 진행`} />
                <small>
                  {a.progress.toLocaleString('ko-KR')}/{a.goal.toLocaleString('ko-KR')} · 보상 {formatBeom(a.reward)}
                  {a.done ? ' · 받았어요' : ''}
                </small>
              </span>
            </li>
          ))}
        </ul>
      ) : tab === 'museum' ? (
        <div className="l-museum">
          <p className="l-help-text">
            {atMuseum
              ? `누구나 종류마다 한 번씩 기증 도장을 찍을 수 있어요. 처음 기증하면 첫 기증자로 이름이 남고 ${formatBeom(FIRST_DONATION_GRANT * mult)}, 이미 있는 물건은 ${formatBeom(CO_DONATION_GRANT * mult)}을 받아요.`
              : '기증은 광장 동쪽의 마을 박물관에서 할 수 있어요. 여기서는 전시를 둘러볼 수 있어요.'}
          </p>
          <MuseumStats view={view} selfActor={selfActor} />
          {DEX_TABS.map(([id, label, ids]) => (
            <section key={id} className="l-museum-shelf" aria-label={label}>
              <h3>
                {label} <small>{ids.filter((x) => museum[x]).length}/{ids.length}</small>
              </h3>
              <ul className="l-dex-grid">
                {ids.map((item) => {
                  const shown = museum[item];
                  const have = needHave(life.me, { item });
                  const others = Math.max(0, (donors[item]?.length ?? (shown ? 1 : 0)) - 1);
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        className="l-dex-cell"
                        data-shown={shown ? true : undefined}
                        data-mine={mine.has(item) || undefined}
                        aria-pressed={picked === item}
                        onClick={() => setPicked(item)}
                        aria-label={`${dex.has(item) ? nameOf(item) : '아직 모르는 것'}${shown ? ` · 첫 기증 ${ACTORS[shown.actor]}${others ? ` 외 ${others}명` : ''}` : ''}${mine.has(item) ? ' · 내 도장 있음' : ''}`}
                      >
                        <ItemIcon id={item} size={34} className={shown || dex.has(item) ? '' : 'is-unknown'} />
                        <small>
                          {shown ? ACTORS[shown.actor] : dex.has(item) ? nameOf(item) : '???'}
                          {others > 0 && <em className="l-museum-plus">+{others}</em>}
                        </small>
                        {mine.has(item) && <Check size={11} className="l-museum-stamp" aria-hidden="true" />}
                      </button>
                      {atMuseum && !mine.has(item) && have > 0 && (
                        <button
                          type="button"
                          className="l-primary l-donate"
                          disabled={busy}
                          onClick={() => void donate(item)}
                          data-testid={`donate-${item}`}
                        >
                          {shown ? '도장' : '기증'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {picked && detail}
        </div>
      ) : (
        <div className="l-dex">
          <ul className="l-dex-grid" data-testid="dex-grid">
            {DEX_TABS.find(([id]) => id === tab)![2].map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="l-dex-cell"
                  data-found={dex.has(item) || undefined}
                  aria-pressed={picked === item}
                  onClick={() => setPicked(item)}
                  aria-label={dex.has(item) ? nameOf(item) : '아직 모르는 것'}
                >
                  <ItemIcon id={item} size={40} className={dex.has(item) ? '' : 'is-unknown'} />
                  <small>{dex.has(item) ? nameOf(item) : '???'}</small>
                  {museum[item] && <Check size={12} className="l-dex-donated" aria-label="박물관에 있어요" />}
                </button>
              </li>
            ))}
          </ul>
          {detail}
        </div>
      )}
    </Modal>
  );
}

/** Village museum progress (shared milestones) and every friend's donations. */
function MuseumStats({ view, selfActor }: { view: CloudRoomView; selfActor: number }) {
  const m = view.life?.social?.museum;
  if (!m) return null;
  const next = MUSEUM_MILESTONES.find((x) => m.count < x.n);
  const rows = [...m.stats].filter((r) => r.total > 0 || r.actor === selfActor).sort((a, b) => b.total - a.total || a.actor - b.actor);
  return (
    <div className="l-museum-stats" data-testid="museum-stats">
      <div className="l-museum-milestones">
        <strong>마을 전시 {m.count}종</strong>
        <ol>
          {m.milestones.map((x) => (
            <li key={x.n} data-reached={x.reached || undefined}>
              {x.reached ? <Check size={12} aria-hidden="true" /> : null} {x.n}종 · {x.name}
            </li>
          ))}
        </ol>
        <small>{next ? `${next.n - m.count}종 더 모이면 기증한 모두가 “${next.name}” 보상을 받아요.` : '모든 전시 목표를 이뤘어요!'}</small>
      </div>
      <ul className="l-museum-people" aria-label="친구별 기증">
        {rows.map((r) => (
          <li key={r.actor} data-me={r.actor === selfActor || undefined}>
            <b>{ACTORS[r.actor]}</b> 기증 {r.total} · 첫 기증 {r.first}
          </li>
        ))}
      </ul>
    </div>
  );
}
