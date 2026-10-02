'use client';
// 낚시 수첩 (J in the fishing sheet): 도감 with silhouettes and hints for
// fish I have not met, my records and the village records, the weekly cup
// (standings, last weeks, prizes) and 채비 (rod, tackle slots, bait, crab pots).
import { useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FISH, FISH_BY_ID, ITEM_BY_ID, SPOT_INFO, type FishDef, type Spot } from '../lounge-items';
import { BAITS, BEHAVIOUR_NAME, FISH_PROFILE, POT_FISH, TACKLES, type TackleId } from '../lounge-fish-data';
import { FISH_GATE, gateText } from '../lounge-fish-data-fresh';
import { gramsText, rarityOf, type AnglingView } from '../lounge-fish-engine';
import { SEASON_INFO } from '../lounge-calendar';
import { ACTORS } from '../lounge-roster';
import { formatBeom } from '../lounge-text';
import { Modal } from './Modal';
import { ItemIcon, QualityStar } from './ItemIcon';
import { FishArt } from './FishArt';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import './fishing-reel.css';

type Tab = 'dex' | 'records' | 'cup' | 'gear';
const RARITY = { legend: '전설', rare: '드묾', uncommon: '보통', common: '흔함' } as const;
const WHEN = { day: '낮', night: '밤', any: '하루 종일' } as const;
const SKY = { rain: '비 오는 날', dry: '맑은 날', any: '날씨 상관없음' } as const;
const dateText = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};
/** Bite hours on the game clock (게임 하루 = 실제 1시간). */
const hoursText = (h?: readonly [number, number]) => (h ? `게임 ${h[0]}시~${h[1]}시` : '');
const POT_IDS = new Set(POT_FISH.map((f) => f.id));
const BOOK: readonly FishDef[] = [...FISH.filter((f) => f.spots.length), ...POT_FISH];

export function FishingJournal({
  room,
  view,
  notify,
  spot,
  onClose,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  spot?: Spot;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('dex');
  const life = view.life;
  const a = life?.angling;
  return (
    <Modal title="낚시 수첩" onClose={onClose} wide className="l-life-modal l-fj-modal" keyHints={[{ keys: [{ label: '1~4' }], does: '쪽 넘기기' }]}>
      {!life || !a ? (
        <EmptyState glyph="fish" title="마을에 연결되면 볼 수 있어요" />
      ) : (
        <div className="l-fj">
          <Tabs<Tab>
            idBase="fj"
            label="낚시 수첩 쪽"
            numberKeys
            value={tab}
            onChange={setTab}
            items={[
              { id: 'dex', label: '도감', glyph: 'fish' },
              { id: 'records', label: '기록', glyph: 'award' },
              { id: 'cup', label: '주간 대회', glyph: 'trophy' },
              { id: 'gear', label: '채비', glyph: 'hook' },
            ]}
          />
          <div {...tabPanelProps('fj', tab)}>
            {tab === 'dex' && <DexPage view={view} a={a} spot={spot} />}
            {tab === 'records' && <RecordsPage view={view} a={a} />}
            {tab === 'cup' && <CupPage room={room} view={view} a={a} notify={notify} />}
            {tab === 'gear' && <GearPage room={room} view={view} a={a} notify={notify} />}
          </div>
        </div>
      )}
    </Modal>
  );
}

function DexPage({ view, a, spot }: { view: CloudRoomView; a: AnglingView; spot?: Spot }) {
  const life = view.life!;
  const dex = new Set(life.me.dex ?? []);
  const [picked, setPicked] = useState<string>(() => BOOK.find((f) => spot && f.spots.includes(spot))?.id ?? BOOK[0].id);
  const f = FISH_BY_ID[picked];
  const known = dex.has(picked);
  const p = FISH_PROFILE[picked];
  const log = a.me.log[picked];
  // Hints: where it lives is always shown; when/what weather only after I have
  // caught something at one of its spots (or already know the fish).
  const scouted = known || f.spots.some((s) => a.me.spots.includes(s));
  const found = BOOK.filter((x) => dex.has(x.id)).length;
  const seasons = p?.season ? [p.season] : f.seasons;
  return (
    <section className="l-fj-section" aria-label="물고기 도감">
      <p>
        {found}/{BOOK.length}종을 만났어요. 못 만난 물고기는 그림자로 보여요. 그 물고기가 사는 낚시터에서 한 마리라도 낚으면 철·시각 힌트가 열려요.
      </p>
      <div className="l-fj-detail" data-unknown={!known || undefined} data-testid="fj-detail">
        <FishArt id={picked} size={88} unknown={!known} />
        <div>
          <h3>
            {known ? f.name : '아직 못 만난 물고기'} {log && log.q > 0 ? <QualityStar quality={log.q} /> : null}
          </h3>
          <p>{known ? f.note : POT_IDS.has(picked) ? '통발에 들어올지도 몰라요.' : '어디선가 헤엄치고 있어요.'}</p>
          <dl>
            <dt>사는 곳</dt>
            <dd>{POT_IDS.has(picked) ? (['daseulgi', 'shrimp'].includes(picked) ? '민물 통발' : '바다 통발') : f.spots.map((s) => SPOT_INFO[s].name).join(' · ')}</dd>
            <dt>희귀도</dt>
            <dd>{RARITY[rarityOf(f)]}</dd>
            {!POT_IDS.has(picked) && (
              <>
                <dt>나오는 때</dt>
                <dd>
                  {scouted
                    ? [seasons.map((s) => SEASON_INFO[s].name).join('·'), WHEN[f.time], hoursText(p?.hours), SKY[f.sky]].filter(Boolean).join(' · ')
                    : '이 낚시터에서 한 마리 낚으면 알 수 있어요'}
                </dd>
                <dt>힘쓰는 모양</dt>
                <dd>{known && p ? `${BEHAVIOUR_NAME[p.behaviour]} · 난이도 ${p.difficulty}` : '—'}</dd>
              </>
            )}
            {p?.legend && (
              <>
                <dt>조건</dt>
                <dd>
                  낚시 Lv{p.legend.level} · 낚싯대 {p.legend.rod}단 이상 · 친구마다 한 번
                </dd>
              </>
            )}
            {FISH_GATE[picked] && (
              <>
                <dt>조건</dt>
                <dd>{gateText(FISH_GATE[picked])}</dd>
              </>
            )}
            <dt>크기</dt>
            <dd>
              {f.cm[0]}~{f.cm[1]}cm
            </dd>
            <dt>내 기록</dt>
            <dd>{log ? `${log.n}마리 · 최대 ${log.cm}cm · ${gramsText(log.g)} · 처음 ${dateText(log.first)}` : '—'}</dd>
            <dt>마을 최대어</dt>
            <dd>{life.records?.[picked] ? `${life.records[picked].cm}cm · ${ACTORS[life.records[picked].actor] ?? '친구'}` : '—'}</dd>
          </dl>
        </div>
      </div>
      <ul className="l-fj-grid">
        {BOOK.map((x) => {
          const k = dex.has(x.id);
          return (
            <li key={x.id} className="l-fj-cell" data-unknown={!k || undefined} data-rarity={rarityOf(x)}>
              <button type="button" aria-pressed={picked === x.id} onClick={() => setPicked(x.id)} aria-label={k ? x.name : `못 만난 물고기 (${RARITY[rarityOf(x)]})`}>
                <FishArt id={x.id} size={48} unknown={!k} />
                <span>{k ? x.name : '?'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecordsPage({ view, a }: { view: CloudRoomView; a: AnglingView }) {
  const life = view.life!;
  const mine = Object.entries(a.me.log).sort((p, q) => q[1].g - p[1].g);
  const village = Object.entries(life.records ?? {})
    .filter(([id]) => FISH_BY_ID[id])
    .sort((p, q) => q[1].cm - p[1].cm)
    .slice(0, 12);
  const total = mine.reduce((s, [, l]) => s + l.n, 0);
  return (
    <section className="l-fj-section" aria-label="기록">
      <h3>내 기록</h3>
      <p>
        지금까지 {total}마리 · {mine.length}종 · 마을 전체 {a.total.toLocaleString()}마리
      </p>
      {mine.length ? (
        <table className="l-fj-table">
          <thead>
            <tr>
              <th scope="col">물고기</th>
              <th scope="col" className="num">마리</th>
              <th scope="col" className="num">최대 크기</th>
              <th scope="col" className="num">최대 무게</th>
              <th scope="col">최고 품질</th>
            </tr>
          </thead>
          <tbody>
            {mine.map(([id, l]) => (
              <tr key={id}>
                <td>{FISH_BY_ID[id]?.name ?? id}</td>
                <td className="num">{l.n}</td>
                <td className="num">{l.cm}cm</td>
                <td className="num">{gramsText(l.g)}</td>
                <td>{l.q ? <QualityStar quality={l.q} /> : '보통'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState glyph="fish" title="아직 기록이 없어요" hint="새 낚시로 낚은 물고기부터 여기에 적혀요." />
      )}
      <h3>마을 최대어</h3>
      {village.length ? (
        <table className="l-fj-table">
          <thead>
            <tr>
              <th scope="col">물고기</th>
              <th scope="col" className="num">크기</th>
              <th scope="col">누가</th>
              <th scope="col">언제</th>
            </tr>
          </thead>
          <tbody>
            {village.map(([id, r]) => (
              <tr key={id}>
                <td>{FISH_BY_ID[id].name}</td>
                <td className="num">{r.cm}cm</td>
                <td>{ACTORS[r.actor] ?? '친구'}</td>
                <td>{dateText(r.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState glyph="fish" title="아직 마을 기록이 없어요" />
      )}
    </section>
  );
}

function CupPage({ room, view, a, notify }: { room: CloudRoom; view: CloudRoomView; a: AnglingView; notify: Notify }) {
  const [run, busy] = useLifeAction(room, notify);
  const me = view.life?.actors?.[view.self];
  // Once 항구 구역 is open the cup is held there: prizes are handed out at 낚시조합.
  const awayFromHarbor = !!view.life?.flags?.includes('district-harbor') && view.players.find((p) => p.id === view.self)?.area !== 'harbor';
  const ends = new Date(a.cup.resetAt + 9 * 3_600_000);
  return (
    <section className="l-fj-section" aria-label="주간 낚시 대회">
      <h3>이번 주 낚시 대회</h3>
      <p>
        낚은 물고기마다 점수(흔함 10 · 보통 20 · 드묾 40 · 전설 100, 클수록 최대 2배, 완벽하게 낚으면 ×1.2)를 받고, 친구마다 가장 높은 3마리를 더해요. {ends.getUTCMonth() + 1}월 {ends.getUTCDate()}일 0시에 마감해요. {a.cup.minPlayers}명 이상 참가하면 1~3위가 {a.cup.prizes.map((p) => formatBeom(p)).join(' / ')}을 받아요.
      </p>
      {a.cup.standings.length ? (
        <ol className="l-fj-rows" data-testid="fj-cup">
          {a.cup.standings.map((row, i) => (
            <li key={row.actor}>
              <b>{i + 1}위</b>
              <span>
                <strong>
                  {ACTORS[row.actor] ?? '친구'}
                  {row.actor === me ? ' (나)' : ''}
                </strong>
                <small>{row.top.map((c) => `${FISH_BY_ID[c.fish]?.name} ${c.cm}cm ${c.score}점`).join(' · ')}</small>
              </span>
              <b>{row.score}점</b>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState glyph="fish" title="아직 참가한 친구가 없어요" hint="한 마리만 낚아도 대회에 이름이 올라가요." />
      )}
      <h3>지난 대회</h3>
      {a.cup.history.length ? (
        <ul className="l-fj-rows">
          {[...a.cup.history].reverse().map((h) => {
            const rank = h.ranks.findIndex((r) => r.actor === me);
            const can = rank >= 0 && h.players >= a.cup.minPlayers && !h.claimed.includes(me ?? -1);
            return (
              <li key={h.week}>
                <span>
                  <strong>{h.ranks.map((r, i) => `${i + 1}위 ${ACTORS[r.actor] ?? '친구'} ${r.score}점`).join(' · ') || '참가자 없음'}</strong>
                  <small>
                    참가 {h.players}명{h.players < a.cup.minPlayers ? ` · ${a.cup.minPlayers}명이 안 돼서 상품 없음` : ''}
                  </small>
                </span>
                {can && (
                  <GameButton
                    variant="primary"
                    size="s"
                    disabled={busy || awayFromHarbor}
                    title={awayFromHarbor ? '항구 낚시조합에서 받아요' : undefined}
                    onClick={() => void run({ kind: 'cupClaim', week: h.week }, `대회 ${rank + 1}위 상품 ${formatBeom(a.cup.prizes[rank])}을 받았어요.`, 'coin')}
                  >
                    상품 받기 {formatBeom(a.cup.prizes[rank])}
                  </GameButton>
                )}
                {rank >= 0 && h.claimed.includes(me ?? -1) && <small>받았어요</small>}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState glyph="fish" title="아직 끝난 대회가 없어요" />
      )}
    </section>
  );
}

function GearPage({ room, view, a, notify }: { room: CloudRoom; view: CloudRoomView; a: AnglingView; notify: Notify }) {
  const [run, busy] = useLifeAction(room, notify);
  const inv = view.life?.me.inv ?? {};
  const slots = Array.from({ length: a.me.tackleSlots }, (_, i) => a.me.tackle[i] ?? null);
  const now = useNow(true, 30_000) + view.clockOffset;
  return (
    <section className="l-fj-section" aria-label="채비">
      <h3>낚싯대 {a.me.rod}단 · 낚시 Lv{a.me.level}</h3>
      <p>
        손맛 칸 높이 {Math.round(a.me.bar / 100)}% · 보물 상자 {a.me.treasurePct}% · 찌 {a.me.tackleSlots}칸 (낚싯대 3단 1칸, 4단부터 2칸). 대장간에서 낚싯대를 올리면 칸이 넓어져요.
      </p>
      <h3>찌</h3>
      {slots.length ? (
        <ul className="l-fj-rows">
          {slots.map((t, i) => (
            <li key={i}>
              {t ? <ItemIcon id={t.id} size={36} /> : <span aria-hidden="true" />}
              <span>
                <strong>{t ? ITEM_BY_ID[t.id]?.name : `빈 칸 ${i + 1}`}</strong>
                <small>{t ? `${ITEM_BY_ID[t.id]?.note} · ${t.uses}번 남음` : '가방에 있는 찌를 달 수 있어요'}</small>
              </span>
              {TACKLES.filter((id) => (inv[id] ?? 0) > 0 && id !== t?.id).map((id: TackleId) => (
                <GameButton key={id} size="s" disabled={busy} onClick={() => void run({ kind: 'anglerTackle', slot: i, item: id }, `${ITEM_BY_ID[id]?.name}를 달았어요.`)}>
                  {ITEM_BY_ID[id]?.name} 달기
                </GameButton>
              ))}
              {t && (
                <GameButton size="s" variant="ghost" disabled={busy} onClick={() => void run({ kind: 'anglerTackle', slot: i, item: null }, t.uses >= 20 ? '찌를 가방에 넣었어요.' : '닳은 찌를 뗐어요.')}>
                  떼기{t.uses < 20 ? ' (닳은 찌는 버려져요)' : ''}
                </GameButton>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState glyph="fish" title="낚싯대 3단부터 찌를 달 수 있어요" hint="잡화점 도구 칸에서 낚싯대를 올릴 수 있어요." />
      )}
      <h3>미끼</h3>
      <ul className="l-fj-rows">
        {BAITS.map((b) => (
          <li key={b}>
            <ItemIcon id={b} size={32} />
            <span>
              <strong>
                {ITEM_BY_ID[b]?.name} · {inv[b] ?? 0}개
              </strong>
              <small>{ITEM_BY_ID[b]?.note}</small>
            </span>
          </li>
        ))}
      </ul>
      <h3>
        통발 {a.me.pots.length}/{a.me.potMax}
      </h3>
      {a.me.pots.length ? (
        <ul className="l-fj-rows" data-testid="fj-pots">
          {a.me.pots.map((p) => (
            <li key={p.spot}>
              <ItemIcon id="crabpot" size={32} />
              <span>
                <strong>{SPOT_INFO[p.spot].name}</strong>
                <small>{p.ready ? '다 찼어요. 그 낚시터에서 거둬요.' : p.bait ? `${Math.max(1, Math.ceil((p.readyAt - now) / 60_000))}분 뒤에 차요` : '미끼를 넣어야 해요'}</small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState glyph="fish" title="놓은 통발이 없어요" hint={`통발은 잡화점에서 사거나(${formatBeom(2_500)}) 나무 6·구리 2로 만들어요. 낚시터에서 "통발 놓기"를 눌러요.`} />
      )}
    </section>
  );
}
