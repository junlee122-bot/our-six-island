'use client';
// The counters of 범마을 부동산 (신형만 · 봉미선 in turns), 나무결 가구점 (목수 발키리) and the shop
// upgrade board (also 허 선장's in 허풍 주점). Keyboard first: Tab / ←→ switch
// the counter's pages, ↑↓ (or ←→↑↓ in the showroom) move the selection,
// Enter buys or chips in, +/− change the count, R rerolls today's stock.
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Coins, Crown, Hammer, House, Lock, RefreshCw, Sparkles } from '../ui/icons';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FURNITURE_BY_REF, HOUSE_TIERS, THEME_STYLE_PRICE, type HouseTier, type ThemeStyle } from '../lounge-items';
import { FREE_FLOOR, FREE_WALL, LEGACY_ROOM, MOUNT_NAME, ROOM_TIERS, catalogEntry, legacyThemeRoom, type Bedroom } from '../lounge-bedroom-data';
import { BEDROOM_THEMES } from '../lounge-bedroom-themes';
import { BEDROOM_FLOOR_COLOR, BEDROOM_WALL_COLOR, FLOOR_NAMES, WALL_NAMES } from '../lounge-bedroom-styles';
import { THUMBNAILS } from '../lounge-bedroom-art';
import { defaultLook, type LoungeSave } from '../lounge-look';
import { FURNITURE_ART } from '../lounge-furniture-art';
import {
  UPGRADE_CATEGORY_NAME,
  VENUE_CATEGORIES,
  VENUE_MIN_GIVE,
  VENUE_NAME,
  VENUE_UPGRADES,
  housePrice,
  venueLook,
  venuesFromView,
  type UpgradeCategory,
  type UpgradeDef,
  type UpgradeVenue,
} from '../lounge-venue-data';
import { DealerAvatar } from '../lounge-dealer-host';
import { HOSTS, type DealerMood } from '../lounge-dealer-lines';
import type { HostId } from '../lounge-host-sprites';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { ConfirmModal, Modal } from './Modal';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import { realtyDuty, type RealtyKeeper } from '../lounge-npc-schedule';
import { weekdayOf } from '../lounge-calendar';
import { kstDay } from '../lounge-economy';
import './shop-counter.css';

type Base = { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void };
const Bedroom3D = lazy(() => import('../lounge-bedroom-3d').then((m) => ({ default: m.Bedroom3D })));

/** The shopkeeper at the counter: portrait (mood follows the moment), a line and, for residents, a way to talk. */
function Keeper({ host, mood, line, onTalk }: { host: HostId; mood: DealerMood; line: string; onTalk?: () => void }) {
  return (
    <div className={onTalk ? 'sc-keeper has-talk' : 'sc-keeper'} data-testid="shop-keeper" data-host={host}>
      <span className="sc-keeper-face">
        <DealerAvatar host={host} mood={mood} />
      </span>
      <p>
        <b>{HOSTS[host].name}</b>
        <small>{HOSTS[host].title}</small>
        <span key={line}>{line}</span>
      </p>
      {onTalk && (
        <button type="button" className="sc-keeper-talk" onClick={onTalk} data-testid="keeper-talk">
          이야기하기
        </button>
      )}
    </div>
  );
}

/** Tab strip; ←/→ (or Tab inside) switches pages. */
function Pages<T extends string>({ pages, page, onPage }: { pages: readonly { id: T; label: string }[]; page: T; onPage: (p: T) => void }) {
  return (
    <div className="sc-pages" role="tablist">
      {pages.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={page === p.id}
          className={page === p.id ? 'is-on' : ''}
          onClick={() => onPage(p.id)}
          data-testid={`shop-page-${p.id}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** Arrow keys on a list: returns the handler (Enter → act on the selection). */
function listKeys(n: number, at: number, setAt: (i: number) => void, onEnter: () => void, cols = 1) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || (t !== e.currentTarget && t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' '))) return;
    const step = e.key === 'ArrowDown' ? cols : e.key === 'ArrowUp' ? -cols : e.key === 'ArrowRight' && cols > 1 ? 1 : e.key === 'ArrowLeft' && cols > 1 ? -1 : 0;
    if (step) setAt(Math.max(0, Math.min(n - 1, at + step)));
    else if (e.key === 'Enter') onEnter();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };
}

/* ------------------------------------------------------------ upgrade board */

/** One shop's upgrades by category and tier, with shared 범 contributions. */
export function UpgradeBoard({ venue, room, view, notify, host }: Omit<Base, 'onClose'> & { venue: UpgradeVenue; host: HostId }) {
  const [run, busy] = useLifeAction(room, notify);
  const list = view.life?.venues ?? [];
  const byId = new Map(list.map((v) => [v.id, v]));
  const cats = VENUE_CATEGORIES[venue];
  const [cat, setCat] = useState<UpgradeCategory>(cats[0]);
  const defs = VENUE_UPGRADES.filter((d) => d.venue === venue && d.category === cat);
  const firstOpen = Math.max(0, defs.findIndex((d) => byId.get(d.id)?.open));
  const [pick, setPick] = useState<{ cat: UpgradeCategory; at: number }>({ cat, at: firstOpen });
  const at = pick.cat === cat ? pick.at : firstOpen;
  const def = defs[at] ?? defs[0];
  const [give, setGive] = useState<{ def: UpgradeDef; n: number } | null>(null);
  const balance = view.wallet.balance;
  const state = byId.get(def.id);
  const left = def.cost - (state?.got ?? 0);
  const chips = [VENUE_MIN_GIVE, 10_000, 50_000, 100_000].filter((n) => n < left);
  const done = list.filter((v) => v.done && VENUE_UPGRADES.find((d) => d.id === v.id)?.venue === venue).length;
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => boardRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);
  const total = VENUE_UPGRADES.filter((d) => d.venue === venue).length;
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const i = cats.indexOf(cat);
      setCat(cats[(i + (e.key === 'ArrowRight' ? 1 : -1) + cats.length) % cats.length]);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    listKeys(defs.length, at, (i) => setPick({ cat, at: i }), () => {
      if (state?.open && balance >= Math.min(VENUE_MIN_GIVE, left)) setGive({ def, n: Math.min(left, balance, 10_000) });
    })(e);
  };
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- ←→ category, ↑↓ tier, Enter chips in.
    <div className="sc-upgrades" ref={boardRef} tabIndex={-1} role="application" aria-roledescription={`${VENUE_NAME[venue]} 업그레이드`} onKeyDown={onKey} data-testid={`upgrades-${venue}`}>
      <p className="sc-help">
        친구들이 범을 조금씩 보태 함께 짓는 가게 업그레이드예요. 다 모이면 {josa(VENUE_NAME[venue], '이/가')} 모두에게 바뀌어요. 지금 {done}/{total}개 완성.
        <kbd>←→</kbd> 분류 <kbd>↑↓</kbd> 단계 <kbd>Enter</kbd> 보태기
      </p>
      <div className="sc-cats" role="tablist">
        {cats.map((c) => {
          const tier = venueLook(venuesFromView(list), venue).tiers[c] ?? 0;
          return (
            <button key={c} type="button" role="tab" aria-selected={c === cat} className={c === cat ? 'is-on' : ''} onClick={() => setCat(c)} data-testid={`upgrade-cat-${c}`}>
              {UPGRADE_CATEGORY_NAME[c]}
              <small>{tier}단계</small>
            </button>
          );
        })}
      </div>
      <ol className="sc-tiers">
        {defs.map((d, i) => {
          const s = byId.get(d.id);
          const got = s?.got ?? 0;
          return (
            <li key={d.id} className={(i === at ? 'is-cursor ' : '') + (s?.done ? 'is-done ' : s?.open ? 'is-open ' : 'is-locked')} data-testid={`upgrade-${d.id}`}>
              <button type="button" className="sc-tier-pick" onClick={() => setPick({ cat, at: i })} aria-current={i === at}>
                <span className="sc-tier-badge">{s?.done ? <Check size={16} /> : s?.open ? <Hammer size={16} /> : <Lock size={16} />}</span>
                <span className="sc-tier-text">
                  <strong>
                    {d.tier}단계 · {d.name}
                  </strong>
                  <small>{d.note}</small>
                  <span className="sc-meter" aria-label={`${formatBeom(got)} / ${formatBeom(d.cost)}`}>
                    <i style={{ width: `${Math.min(100, (got / d.cost) * 100)}%` }} />
                  </span>
                  <small className="sc-got">
                    {s?.done
                      ? '완성!'
                      : `${formatBeom(got)} / ${formatBeom(d.cost)}${s?.open ? '' : ` · ${d.tier - 1}단계 다음에 열려요`}`}
                    {s && Object.keys(s.by).length > 0 && (
                      <span className="sc-helpers">
                        {' '}
                        · 보탠 친구{' '}
                        {Object.entries(s.by)
                          .sort((a, b) => b[1] - a[1])
                          .map(([a]) => ACTORS[Number(a)])
                          .join(', ')}
                      </span>
                    )}
                  </small>
                </span>
              </button>
              {s?.open && (
                <span className="sc-give">
                  <button
                    type="button"
                    className="l-primary"
                    disabled={busy || balance < Math.min(VENUE_MIN_GIVE, d.cost - got)}
                    onClick={() => setGive({ def: d, n: Math.min(d.cost - got, Math.max(VENUE_MIN_GIVE, Math.min(balance, 10_000))) })}
                    data-testid={`give-${d.id}`}
                  >
                    범 보태기
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {give && (
        <ConfirmModal
          title={`“${give.def.name}”에 범을 보탤까요?`}
          body={
            <div className="sc-give-body">
              <p>
                <b>{VENUE_NAME[give.def.venue]}</b> {give.def.tier}단계 · {give.def.name}. 남은 범{' '}
                {formatBeom(give.def.cost - (byId.get(give.def.id)?.got ?? 0))}. 보탠 범은 돌려받지 않아요.
              </p>
              <div className="sc-chips">
                {[...chips, give.def.cost - (byId.get(give.def.id)?.got ?? 0)].map((n) => (
                  <button key={n} type="button" className={give.n === n ? 'is-on' : ''} disabled={n > balance} onClick={() => setGive({ ...give, n })}>
                    {n === give.def.cost - (byId.get(give.def.id)?.got ?? 0) ? `남은 전부 ${formatBeom(n)}` : formatBeom(n)}
                  </button>
                ))}
              </div>
              <p className="sc-left">
                <Coins size={14} /> 지갑 {formatBeom(balance)} → {formatBeom(balance - give.n)}
              </p>
            </div>
          }
          confirmLabel={`${formatBeom(give.n)} 보태기`}
          busyLabel="보태는 중…"
          cancelLabel="다음에"
          onClose={() => setGive(null)}
          onConfirm={async () => {
            const ok = await run({ kind: 'venueUpgrade', upgrade: give.def.id, n: give.n }, `“${give.def.name}”에 ${formatBeom(give.n)}을 보탰어요.`, 'coin');
            if (ok) setGive(null);
            return ok;
          }}
        />
      )}
      <p className="sc-host-note">
        <Sparkles size={14} aria-hidden="true" /> {HOSTS[host].name}: 다 모이면 제가 바로 공사를 맡을게요.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ 범마을 부동산 */

const WALL_SWATCH: Record<string, string> = {
  gold: '#e9d8b0',
  navy: '#5d6b86',
  rose: '#d7b3b5',
  forest: '#8fa58c',
  silver: '#d4d8de',
  terracotta: '#d39a7c',
  velvet: '#4a3d63',
};
const FLOOR_SWATCH: Record<string, string> = {
  marble: '#e8e4dd',
  herringbone: '#a8825a',
  cherry: '#9b5a45',
  ebony: '#4a3a32',
};
const STYLE_NAME: Record<string, string> = {
  gold: '샴페인 골드',
  navy: '밤바다 남색',
  rose: '로즈 스모크',
  forest: '깊은 숲',
  silver: '달빛 은색',
  terracotta: '노을 테라코타',
  velvet: '별밤 벨벳',
  marble: '대리석',
  herringbone: '헤링본',
  cherry: '체리목',
  ebony: '흑단',
};

/** A little room diorama of a tier's styles (wall behind, floor below). */
function RoomPreview({ tier }: { tier: HouseTier }) {
  const walls = tier.walls?.length ? tier.walls : ['cream'];
  const floors = tier.floors?.length ? tier.floors : ['oak'];
  return (
    <div className="sc-preview" aria-label={`${tier.name} 미리보기`}>
      {walls.map((w, i) => (
        <span key={w} className="sc-room" style={{ ['--wall' as string]: WALL_SWATCH[w] ?? '#eee6d7', ['--floor' as string]: FLOOR_SWATCH[floors[i % floors.length]] ?? '#c3a579' }}>
          <i className="sc-room-window" />
          <i className="sc-room-bed" />
          <small>
            {STYLE_NAME[w] ?? '기본 벽'}
            {tier.floors?.length ? ` · ${STYLE_NAME[floors[i % floors.length]]}` : ''}
          </small>
        </span>
      ))}
      {tier.tier >= 3 && (
        <span className="sc-house" data-tier={tier.tier}>
          <House size={42} aria-hidden="true" />
          <small>{tier.tier === 3 ? '마을의 내 집 앞 꽃밭과 등불' : '2층 다락과 명패'}</small>
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ 모델하우스 관람 */

const styleOwned = (style: string, styles: readonly string[]) =>
  style === FREE_WALL || style === FREE_FLOOR || styles.includes(style);

/**
 * One friend's old themed room, walked through as a model house (the new
 * rooms' camera and figures; look only, nothing can be taken home).
 */
function ModelHouse({ actor, save, onClose }: { actor: number; save: LoungeSave; onClose: () => void }) {
  const bedroom = useMemo(() => legacyThemeRoom(actor), [actor]);
  const name = `${ACTORS[actor]}의 방`;
  return (
    <Modal title={`모델하우스 · ${name}`} onClose={onClose} className="sc-counter sc-modelhouse" wide>
      <div className="sc-modelhouse-stage" data-testid="model-house" data-actor={actor}>
        <Suspense fallback={<p className="l-ledger-empty">모델하우스 문을 여는 중…</p>}>
          <Bedroom3D
            save={save}
            visit={{ owner: actor, ownerLook: save.looks[actor] ?? defaultLook(actor), bedroom, host: false }}
            shape={LEGACY_ROOM}
            title={name}
            onExit={onClose}
          />
        </Suspense>
      </div>
    </Modal>
  );
}

/** A tiny room (wall above, floor below) in a theme's colours. */
function Swatch({ wall, floor }: { wall: Bedroom['wall']; floor: Bedroom['floor'] }) {
  return (
    <span className="sc-room sc-room-mini" style={{ ['--wall' as string]: BEDROOM_WALL_COLOR[wall], ['--floor' as string]: BEDROOM_FLOOR_COLOR[floor] }}>
      <i className="sc-room-window" />
      <i className="sc-room-bed" />
    </span>
  );
}

function ModelHouses({ room, view, notify, save, onVisit }: Omit<Base, 'onClose'> & { save?: LoungeSave; onVisit: (actor: number) => void }) {
  const [run, busy] = useLifeAction(room, notify);
  const styles = view.life?.me.styles ?? [];
  const balance = view.wallet.balance;
  const [at, setAt] = useState(0);
  const [confirm, setConfirm] = useState<ThemeStyle | null>(null);
  const theme = BEDROOM_THEMES[at];
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => body.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);
  const onKey = listKeys(BEDROOM_THEMES.length, at, setAt, () => save && onVisit(at), 4);
  const part = (kind: 'wall' | 'floor') => {
    const style = kind === 'wall' ? theme.wall : theme.floor,
      name = kind === 'wall' ? WALL_NAMES[theme.wall] : FLOOR_NAMES[theme.floor],
      owned = styleOwned(style, styles),
      free = style === FREE_WALL || style === FREE_FLOOR;
    return (
      <li key={kind} className={owned ? 'is-done' : ''} data-testid={`model-${kind}`}>
        <span className="sc-style-chip" style={{ ['--chip' as string]: kind === 'wall' ? BEDROOM_WALL_COLOR[theme.wall] : BEDROOM_FLOOR_COLOR[theme.floor] }} aria-hidden="true" />
        <span className="sc-tier-text">
          <strong>
            {kind === 'wall' ? '벽지' : '바닥'} · {name}
          </strong>
          <small>{free ? '처음부터 가지고 있어요' : owned ? '샀어요 · 내 방 꾸미기의 “벽·바닥”에서 골라요' : formatBeom(THEME_STYLE_PRICE)}</small>
        </span>
        {!owned && (
          <button
            type="button"
            className="l-secondary"
            disabled={busy || balance < THEME_STYLE_PRICE}
            onClick={() => setConfirm(style as ThemeStyle)}
            data-testid={`buy-style-${style}`}
          >
            사기
          </button>
        )}
      </li>
    );
  };
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrows pick a model house, Enter walks in.
    <div className="sc-models" ref={body} tabIndex={-1} role="application" aria-roledescription="모델하우스 관람" onKeyDown={onKey} data-testid="model-houses">
      <p className="sc-help">
        예전 방 일곱 개를 모델하우스로 옮겨 두었어요. 구경만 할 수 있고, 마음에 드는 벽지·바닥은 한 장씩 사서 내 방에 쓸 수 있어요.{' '}
        <kbd>←→↑↓</kbd> 고르기 <kbd>Enter</kbd> 들어가 보기
      </p>
      <ul className="sc-model-grid">
        {BEDROOM_THEMES.map((t, i) => (
          <li key={t.id} className={i === at ? 'is-cursor' : ''} data-testid={`model-${i}`}>
            <button type="button" onClick={() => setAt(i)} onDoubleClick={() => save && onVisit(i)} aria-current={i === at}>
              <Swatch wall={t.wall} floor={t.floor} />
              <strong>{ACTORS[i]}의 방</strong>
              <small>{t.title}</small>
            </button>
          </li>
        ))}
      </ul>
      <section className="sc-plan-detail" aria-live="polite">
        <h3>
          {ACTORS[at]}의 방 · {theme.title}
        </h3>
        <p>{theme.description}</p>
        <ul className="sc-styles">{[part('wall'), part('floor')]}</ul>
        <button type="button" className="l-primary" disabled={!save} onClick={() => save && onVisit(at)} data-testid="visit-model">
          <House size={16} /> 들어가 보기 <kbd>Enter</kbd>
        </button>
        <p className="sc-locked">예전 방에 있던 가구는 여기서만 볼 수 있어요. 가구는 나무결 가구점에서 새로 사요.</p>
      </section>
      {confirm && (
        <ConfirmModal
          title="이 벽지·바닥을 살까요?"
          body={
            <>
              <b>{(WALL_NAMES as Record<string, string>)[confirm] ?? (FLOOR_NAMES as Record<string, string>)[confirm]}</b>에{' '}
              <b>{formatBeom(THEME_STYLE_PRICE)}</b>이 들어요. 지갑에 {formatBeom(balance - THEME_STYLE_PRICE)}이 남아요.
            </>
          }
          confirmLabel="사기"
          busyLabel="사는 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const ok = await run({ kind: 'buyRoomStyle', style: confirm }, '샀어요! 내 방 꾸미기의 “벽·바닥”에서 골라 보세요.', 'coin');
            if (ok) setConfirm(null);
            return ok;
          }}
        />
      )}
    </div>
  );
}

/** The realty keepers' voices at the counter: 신형만 (영업맨) and 봉미선 (알뜰한 실장). */
const REALTY_VOICE: Record<RealtyKeeper, { upgrade: string; models: string; next: (t: HouseTier) => string; done: string }> = {
  realtor: {
    upgrade: '사무소를 넓히면 도면실이 생겨서 공사비를 깎아 드릴 수 있어요.',
    models: '예전 방들은 모델하우스로 잘 모셔 뒀어요. 벽지랑 바닥은 한 장씩 팔아요.',
    next: (t) => `다음은 ${t.tier}단계 “${t.name}”이에요. 영업 십오 년 경력으로 도면 보여 드릴까요?`,
    done: '집 확장은 다 끝났어요! 정말 멋진 집이에요. 오늘 맥주가 맛있겠네요.',
  },
  misun: {
    upgrade: '사무소를 넓히면 도면실이 생겨요. 공사비 십 퍼센트, 그게 어디예요!',
    models: '예전 방들은 모델하우스로 모셔 뒀어요. 벽지랑 바닥은 한 장씩, 알뜰하게 골라 가세요.',
    next: (t) => `다음은 ${t.tier}단계 “${t.name}”이에요. 견적은 제가 한 푼까지 꼼꼼히 봐 드릴게요.`,
    done: '집 확장 끝! 이렇게 알뜰하게 해낸 집은 처음 봐요.',
  },
};

export function RealtyCounter({ room, view, notify, onClose, save, onTalk }: Base & { save?: LoungeSave; /** Talk to the keeper (the speech box). */ onTalk?: (npc: RealtyKeeper) => void }) {
  const life = view.life;
  const [page, setPage] = useState<'house' | 'models' | 'upgrade'>('house');
  const [touring, setTouring] = useState<number | null>(null);
  const [run, busy] = useLifeAction(room, notify);
  const tier = life?.me.house ?? 0;
  const venues = venuesFromView(life?.venues);
  const [at, setAt] = useState(Math.min(HOUSE_TIERS.length - 1, tier));
  const [confirm, setConfirm] = useState(false);
  const balance = view.wallet.balance;
  const t = HOUSE_TIERS[at];
  const price = (x: HouseTier) => housePrice(venues, x.tier, x.price);
  const next = HOUSE_TIERS.find((x) => x.tier === tier + 1);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => body.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [page]);
  // Who keeps the counter today (KST weekday); at the weekend the other one shows the model houses.
  const duty = realtyDuty(weekdayOf(kstDay(useNow(true, 60_000) + view.clockOffset)));
  const keeper: RealtyKeeper = page === 'models' && duty.model ? duty.model : duty.counter;
  const voice = REALTY_VOICE[keeper];
  const line = !life
    ? '마을에 연결되면 상담해 드릴게요.'
    : page === 'upgrade'
      ? voice.upgrade
      : page === 'models'
        ? voice.models
        : next
          ? voice.next(next)
          : voice.done;
  const onKey = listKeys(HOUSE_TIERS.length, at, setAt, () => {
    if (next && t.tier === next.tier && price(next) <= balance) setConfirm(true);
  });
  return (
    <Modal title={`${VENUE_NAME.realty} · ${HOSTS[duty.counter].name}`} onClose={onClose} className="sc-counter sc-realty" wide>
      <Keeper host={keeper} mood={page === 'upgrade' ? 'focus' : next ? 'smile' : 'wow'} line={line} onTalk={onTalk ? () => onTalk(keeper) : undefined} />
      <Pages
        pages={[
          { id: 'house', label: '집 확장' },
          { id: 'models', label: '모델하우스 관람' },
          { id: 'upgrade', label: '부동산 가꾸기' },
        ]}
        page={page}
        onPage={setPage}
      />
      {!life ? (
        <p className="l-ledger-empty">마을에 연결되면 부동산에 들어갈 수 있어요.</p>
      ) : page === 'upgrade' ? (
        <UpgradeBoard venue="realty" host={duty.counter} room={room} view={view} notify={notify} />
      ) : page === 'models' ? (
        <ModelHouses room={room} view={view} notify={notify} save={save} onVisit={setTouring} />
      ) : (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- ↑↓ pick a tier, Enter builds the next one.
        <div className="sc-realty-body" ref={body} tabIndex={-1} role="application" aria-roledescription="집 확장 상담" onKeyDown={onKey} data-testid="realty-counter">
          <ol className="sc-plans">
            {HOUSE_TIERS.map((x, i) => {
              const have = x.tier <= tier,
                isNext = x.tier === tier + 1,
                cost = price(x);
              return (
                <li key={x.tier} className={(i === at ? 'is-cursor ' : '') + (have ? 'is-done' : isNext ? 'is-open' : 'is-locked')} data-testid={`house-${x.tier}`}>
                  <button type="button" onClick={() => setAt(i)} aria-current={i === at}>
                    <span className="sc-tier-badge">{have ? <Check size={16} /> : isNext ? <House size={16} /> : <Lock size={16} />}</span>
                    <span className="sc-tier-text">
                      <strong>
                        {x.tier}단계 · {x.name}
                      </strong>
                      <small>
                        {have ? '완료' : formatBeom(cost)}
                        {!have && cost < x.price ? ` (도면실 할인, 원래 ${formatBeom(x.price)})` : ''}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <section className="sc-plan-detail" aria-live="polite">
            <h3>
              {t.tier}단계 · {t.name}
            </h3>
            <p>{t.note}</p>
            <p className="sc-room-size" data-testid="house-room-size">
              방 크기 {ROOM_TIERS[t.tier].w} × {ROOM_TIERS[t.tier].d}칸 (지금 {ROOM_TIERS[tier].w} × {ROOM_TIERS[tier].d}칸)
            </p>
            <RoomPreview tier={t} />
            {t.tier <= tier ? (
              <p className="sc-owned">
                <Check size={16} /> 이미 공사를 마쳤어요. 방이 넓어졌고, 새 벽지·바닥은 내 방 꾸미기의 “벽·바닥”에서 골라요.
              </p>
            ) : next && t.tier === next.tier ? (
              <div className="sc-buy">
                <button type="button" className="l-primary" disabled={busy || price(t) > balance} onClick={() => setConfirm(true)} data-testid="buy-house">
                  {formatBeom(price(t))}에 공사하기 <kbd>Enter</kbd>
                </button>
                {price(t) > balance && <small className="l-why">범이 모자라요 (지갑 {formatBeom(balance)})</small>}
              </div>
            ) : (
              <p className="sc-locked">
                <Lock size={14} /> {t.tier - 1}단계 다음에 열려요.
              </p>
            )}
          </section>
        </div>
      )}
      {touring !== null && save && <ModelHouse actor={touring} save={save} onClose={() => setTouring(null)} />}
      {confirm && next && (
        <ConfirmModal
          title="집을 넓힐까요?"
          body={
            <>
              <b>{next.name}</b>에 <b>{formatBeom(price(next))}</b>이 들어요. 지갑에 {formatBeom(balance - price(next))}이 남아요.
            </>
          }
          confirmLabel="공사하기"
          busyLabel="공사 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(false)}
          onConfirm={() => run({ kind: 'upgradeHouse' }, `집 확장 ${next.tier}단계 “${next.name}”을 마쳤어요!`, 'coin')}
        />
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ 나무결 가구점 */

type Stock = { ref: string; name: string; price: number; limited?: 'season' | 'holiday' | 'luxury' };
/** Shop picture: the drawn art of 'furn-*' pieces, the room thumbnail of 기본 가구. */
const furnitureArt = (ref: string) => FURNITURE_ART[ref] ?? THUMBNAILS[ref];
/**
 * A corner of the new room seen by the room camera: 6 wide, the floor 4 deep
 * (× sin 52°) under the back wall 3.8 high (× cos 52°).
 */
const PREVIEW = { w: 6, floor: 4 * Math.sin((52 * Math.PI) / 180), wall: 3.8 * Math.cos((52 * Math.PI) / 180) };

/**
 * Where a piece goes in the new room and how big it is there: the room seen
 * like the room camera (back wall on top, floor below) with the piece drawn
 * to scale — on the floor, on a table top or on the back wall.
 */
function PlacementPreview({ refId }: { refId: string }) {
  const entry = catalogEntry(refId);
  if (!entry) return null;
  const total = PREVIEW.floor + PREVIEW.wall;
  // Rendered 3D thumbnails leave a margin round the model (about 60% of the picture is the piece).
  const fill = entry.kind === 'model' && !FURNITURE_ART[refId] ? 0.6 : 1;
  const width = `${Math.min(100, (entry.w / PREVIEW.w / fill) * 100)}%`;
  const style: Record<string, string> =
    entry.mount === 'wall'
      ? { ['--w']: width, ['--bottom']: `${((PREVIEW.floor + PREVIEW.wall * 0.35) / total) * 100}%` }
      : entry.mount === 'rug'
        ? { ['--w']: width, ['--bottom']: `${(PREVIEW.floor * 0.3 / total) * 100}%` }
        : { ['--w']: width, ['--bottom']: `${(PREVIEW.floor * 0.45 / total) * 100}%` };
  const size =
    entry.mount === 'wall'
      ? `가로 ${entry.w.toFixed(1)} × 높이 ${entry.h.toFixed(1)}칸`
      : `가로 ${entry.w.toFixed(1)} × 깊이 ${entry.d.toFixed(1)}칸`;
  return (
    <figure className="sc-placement" data-testid="furniture-placement" data-mount={entry.mount}>
      <span className="sc-placement-room" style={{ ['--wall-h' as string]: `${(PREVIEW.wall / total) * 100}%` }}>
        {/* oxlint-disable-next-line nextjs/no-img-element -- Room art (inline SVG or a small webp thumbnail). */}
        <img src={furnitureArt(refId)} alt="" style={style} data-mount={entry.mount} />
      </span>
      <figcaption>
        <strong>{MOUNT_NAME[entry.mount]}</strong>
        <span>
          {size}
          {entry.top ? ' · 위에 작은 소품을 올릴 수 있어요' : ''}
        </span>
        <small>
          새 방 한쪽(가로 {PREVIEW.w}칸)에 놓았을 때의 크기예요. 처음 방은 가로 {ROOM_TIERS[0].w}칸이에요.
        </small>
      </figcaption>
    </figure>
  );
}

export function FurnitureCounter({ room, view, notify, onClose }: Base) {
  const life = view.life;
  const shop = life?.shop;
  const [page, setPage] = useState<'today' | 'basic' | 'luxury' | 'upgrade'>('today');
  const [run, busy] = useLifeAction(room, notify);
  const [at, setAt] = useState(0);
  const [count, setCount] = useState(1);
  const [confirm, setConfirm] = useState<(Stock & { n: number }) | null>(null);
  const [reroll, setReroll] = useState(false);
  const owned = life?.me.furniture ?? {};
  const balance = view.wallet.balance;
  const now = useNow(true, 60_000) + view.clockOffset;
  const items: Stock[] = useMemo(
    () => (page === 'luxury' ? (shop?.luxury ?? []) : page === 'basic' ? (shop?.basic ?? []) : (shop?.items ?? [])),
    [page, shop],
  );
  const item = items[Math.min(at, items.length - 1)];
  const bought = page === 'luxury' && !!item && !!shop?.luxuryBought?.includes(item.ref);
  const n = page === 'luxury' ? 1 : count;
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => grid.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [page]);
  const hours = shop ? Math.max(0, Math.ceil((shop.resetAt - now) / 3_600_000)) : 0;
  // 발키리's voice (lounge-npc-lines-carpenter.ts); the prices and rules stay in the panels.
  const line = !life
    ? '마을에 연결되믄 문 연다. 누나야 바빠요.'
    : page === 'upgrade'
      ? '진열대 늘리믄 매일 가구 더 들여온다. 범 보태라, 한남들아.'
      : page === 'luxury'
        ? '이번 주에만 들어온 귀한 거다. 한 사람당 하나. 독점ㄴㄴ 나빠요.'
        : page === 'basic'
          ? '새 방 기본 가구는 늘 있다. 벽지랑 바닥은 옆 부동산 가 보이소.'
          : item
          ? `${josa(item.name, '은/는')} ${formatBeom(item.price)}. 내가 직접 깎았다. 흥정ㄴㄴ.`
          : '오늘 물건 다 나갔다. 내일 온나.';
  const cols = 4;
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (page !== 'luxury' && page !== 'upgrade' && (e.key === '+' || e.key === '=' || e.key === '-')) {
      setCount((c) => Math.max(1, Math.min(5, c + (e.key === '-' ? -1 : 1))));
      e.preventDefault();
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && page === 'today' && shop?.rerollPrice && !busy) {
      setReroll(true);
      e.preventDefault();
      return;
    }
    listKeys(items.length, at, setAt, () => {
      if (item && !bought && item.price * n <= balance) setConfirm({ ...item, n });
    }, cols)(e);
  };
  return (
    <Modal title={`${VENUE_NAME.furniture} · 발키리`} onClose={onClose} className="sc-counter sc-furniture" wide>
      <Keeper host="carpenter" mood={page === 'upgrade' ? 'focus' : bought ? 'calm' : 'smile'} line={line} />
      <Pages
        pages={[
          { id: 'today', label: `오늘의 가구 ${shop?.items.length ?? 0}` },
          { id: 'basic', label: `기본 가구 ${shop?.basic?.length ?? 0}` },
          { id: 'luxury', label: `이번 주 명품 ${shop?.luxury?.length ?? 0}` },
          { id: 'upgrade', label: '가게 가꾸기' },
        ]}
        page={page}
        onPage={(p) => {
          setPage(p);
          setAt(0);
        }}
      />
      {!life ? (
        <p className="l-ledger-empty">마을에 연결되면 가구점에 들어갈 수 있어요.</p>
      ) : page === 'upgrade' ? (
        <UpgradeBoard venue="furniture" host="carpenter" room={room} view={view} notify={notify} />
      ) : (
        <div className="sc-showroom">
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrows browse, Enter buys, +/− count, R rerolls. */}
          <div className="sc-shelf" ref={grid} tabIndex={-1} role="application" aria-roledescription="가구 진열대" onKeyDown={onKey} data-testid={page === 'luxury' ? 'luxury-shop' : page === 'basic' ? 'basic-shop' : 'furniture-shop'}>
            <p className="sc-help">
              {page === 'basic'
                ? `늘 파는 가구예요${shop?.discount ? ` · 일요 장터 ${shop.discount}% 할인` : ''}.`
                : page === 'luxury'
                ? `매주 월요일에 바뀌어요 (약 ${Math.max(1, Math.ceil(((shop?.luxuryResetAt ?? now) - now) / 86_400_000))}일 뒤).`
                : `매일 자정에 바뀌어요 (약 ${hours}시간 뒤)${shop?.discount ? ` · 일요 장터 ${shop.discount}% 할인` : ''}.`}{' '}
              {page === 'basic' && (
                <span className="sc-room-size" data-testid="furniture-room-size">
                  지금 내 방은 가로 {ROOM_TIERS[Math.min(ROOM_TIERS.length - 1, life?.me.house ?? 0)].w} × 깊이{' '}
                  {ROOM_TIERS[Math.min(ROOM_TIERS.length - 1, life?.me.house ?? 0)].d}칸이에요. 방을 넓히려면 범마을 부동산의 집 확장에 가 보세요.{' '}
                </span>
              )}
              <kbd>←→↑↓</kbd> 둘러보기 <kbd>Enter</kbd> 사기 {page === 'today' && (<><kbd>+/−</kbd> 개수 <kbd>R</kbd> 새로 고치기</>)}
            </p>
            <ul className="sc-grid">
              {items.map((x, i) => {
                const mine = page === 'luxury' && !!shop?.luxuryBought?.includes(x.ref);
                return (
                  <li key={x.ref} className={(i === at ? 'is-cursor ' : '') + (mine ? 'is-bought' : '')} data-testid={`furn-${x.ref}`}>
                    <button type="button" onClick={() => setAt(i)} aria-current={i === at} aria-label={`${x.name} ${formatBeom(x.price)}`}>
                      {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art or a room thumbnail. */}
                      <img src={furnitureArt(x.ref)} alt="" loading="lazy" />
                      <strong>{x.name}</strong>
                      <small>
                        {formatBeom(x.price)}
                        {x.limited && <em>{x.limited === 'luxury' ? '이번 주' : x.limited === 'holiday' ? '명절 한정' : '계절 한정'}</em>}
                      </small>
                      {mine && <Check className="sc-bought" size={18} aria-label="이번 주에 샀어요" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {item && (
            <aside className="sc-detail" aria-live="polite">
              <span className="sc-detail-art">
                {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art or a room thumbnail. */}
                <img src={furnitureArt(item.ref)} alt="" />
                {page === 'luxury' && <Crown className="sc-crown" size={22} aria-hidden="true" />}
              </span>
              <h3>{item.name}</h3>
              <PlacementPreview refId={item.ref} />
              <p>
                {formatBeom(item.price)} · 가진 개수 {owned[item.ref] ?? 0}
                {FURNITURE_BY_REF[item.ref]?.craft ? ' · 공방에서 만들 수도 있어요' : ''}
              </p>
              {page !== 'luxury' && (
                <div className="sc-count" aria-label="개수">
                  <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="하나 빼기">
                    −
                  </button>
                  <b>{count}개</b>
                  <button type="button" onClick={() => setCount((c) => Math.min(5, c + 1))} aria-label="하나 더">
                    +
                  </button>
                </div>
              )}
              {bought ? (
                <p className="sc-owned">
                  <Check size={16} /> 이번 주에 샀어요
                </p>
              ) : (
                <button type="button" className="l-primary" disabled={busy || item.price * n > balance} onClick={() => setConfirm({ ...item, n })} data-testid={`buy-${item.ref}`}>
                  {formatBeom(item.price * n)}에 {n}개 사기 <kbd>Enter</kbd>
                </button>
              )}
              {item.price * n > balance && !bought && <small className="l-why">범이 모자라요 (지갑 {formatBeom(balance)})</small>}
              {page === 'today' && shop?.rerolls !== undefined && (
                <p className="sc-reroll" data-testid="furn-reroll-row">
                  오늘 {shop.rerolls}번 새로 고쳤어요.{' '}
                  {shop.rerollPrice ? (
                    <button type="button" className="l-secondary" disabled={busy || balance < shop.rerollPrice} onClick={() => setReroll(true)} data-testid="furn-reroll">
                      <RefreshCw size={14} /> {formatBeom(shop.rerollPrice)}에 새로 고치기 <kbd>R</kbd>
                    </button>
                  ) : (
                    '오늘은 더 새로 고칠 수 없어요.'
                  )}
                </p>
              )}
            </aside>
          )}
        </div>
      )}
      {confirm && (
        <ConfirmModal
          title="가구를 살까요?"
          body={
            <>
              <b>{confirm.name}</b> {confirm.n}개를 <b>{formatBeom(confirm.price * confirm.n)}</b>에 사요. 지갑에 {formatBeom(balance - confirm.price * confirm.n)}이 남아요.
            </>
          }
          confirmLabel="사기"
          busyLabel="사는 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const ok = await run({ kind: 'buyFurniture', ref: confirm.ref, n: confirm.n }, `${josa(confirm.name, '을/를')} 샀어요! 내 방 꾸미기의 “내 가구”에서 놓아 보세요.`, 'coin');
            if (ok) setConfirm(null);
            return ok;
          }}
        />
      )}
      {reroll && shop?.rerollPrice && (
        <ConfirmModal
          title="오늘의 가구를 새로 고칠까요?"
          body={<>{formatBeom(shop.rerollPrice)}을 내고 진열대를 새 가구로 바꿔요. 이미 산 가구는 그대로예요.</>}
          confirmLabel="새로 고치기"
          busyLabel="바꾸는 중…"
          cancelLabel="다음에"
          onClose={() => setReroll(false)}
          onConfirm={async () => {
            const ok = await run({ kind: 'rerollShop' }, `오늘의 가구를 ${formatBeom(shop.rerollPrice!)}에 새로 고쳤어요.`, 'coin');
            if (ok) {
              setReroll(false);
              setAt(0);
            }
            return ok;
          }}
        />
      )}
    </Modal>
  );
}

/** 허풍 주점: 허 선장 at the bar — the tavern's upgrade board. */
export function TavernUpgrades({ room, view, notify, onClose }: Base) {
  const done = (view.life?.venues ?? []).filter((v) => v.done && v.id.startsWith('tavern-')).length;
  return (
    <Modal title={`${VENUE_NAME.tavern} · 허 선장`} onClose={onClose} className="sc-counter sc-tavern" venue="tavern" wide>
      <Keeper
        host="captain"
        mood={done ? 'smile' : 'calm'}
        line={
          done
            ? `벌써 ${done}번이나 가게를 꾸몄어요. 내가 젊을 땐 배 한 척을 통째로 꾸몄다니까요!`
            : '우리 주점, 조금만 손보면 항구에서 제일가는 곳이 될 거예요. 같이 꾸며 볼래요?'
        }
      />
      <UpgradeBoard venue="tavern" host="captain" room={room} view={view} notify={notify} />
    </Modal>
  );
}
