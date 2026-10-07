'use client';
// 우리 농장 F3 (handover/design/design-our-farm.md §3-5, §10, §11): the window
// E opens on a facility site, the 공동 밭 and the 공동 창고. An empty site
// lists what may stand there with its unlock and cost; a shared one being
// built shows the funding (범 and materials, like 마을 개척); a built one its
// own page (greenhouse beds, fruit trees, the machine yard's tier; F5: the
// 양식장's fish and requests, the 품종 개량소's batches), its upgrade and
// demolishing. Every change is a server action
// (lounge-farm-sites.ts); this only shows the view and sends the choice.
import { Fragment, useState, type ReactNode } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROPS, CROP_INFO, QUALITY_NAME, cropInSeason, type Crop, type LifeAction } from '../lounge-life';
import {
  COMMON_GOAL_GIANTS,
  FACILITY_BY_ID,
  GREENHOUSE_PER_FRIEND,
  ORCHARD_PLOT_DAYS,
  ORCHARD_PLOT_HOLD,
  SITE_MIN_BEOM,
  SITE_SIZE_NAME,
  facilitiesFor,
  maxTier,
  siteActor,
  siteSize,
  slotsAt,
  tierCost,
  unlockBlock,
  unlockText,
  upgradeBlock,
  type FacilityCost,
  type FacilityDef,
} from '../lounge-farm-sites-data';
import type { FarmSitesView, SitePlotView, SiteView } from '../lounge-farm-sites';
import { FRUIT_TREE_KINDS, SAPLINGS, type FruitTreeKind } from '../lounge-stage3-data';
import { BUNDLES, FISH_BY_ID } from '../lounge-items';
import { POND_GROW_DAYS, POND_HOLD, isRoeId, pondFishOk } from '../lounge-farm-pond-data';
import { IMPROVED_GOLD_PTS, SEEDLAB_MS } from '../lounge-farm-data';
import { SEASON_INFO } from '../lounge-calendar';
import { kstDay } from '../lounge-economy';
import { itemName } from '../lounge-life-plus';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Glyph } from '../ui/Glyph';
import { MoreActions } from '../ui/MoreActions';
import { CropStageArt, ItemIcon } from './ItemIcon';
import { Modal, ConfirmModal } from './Modal';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import './town.css';
import './farm-sites.css';
import { FarmBarn } from './FarmBarn';
import { SKILL_INFO } from '../lounge-growth-data';

export type SiteTarget = { kind: 'site'; id: string } | { kind: 'common' } | { kind: 'store' };
type Props = { room: CloudRoom; view: CloudRoomView; notify: Notify; target: SiteTarget; onClose: () => void };
type Run = (a: LifeAction, done: string) => void;

const plotLabel = (p: SitePlotView | undefined) =>
  !p ? '빈 칸' : p.c ? `${CROP_INFO[p.c].name}${p.r ? ' · 다 자람' : p.w ? ' · 촉촉' : ' · 목말라요'}` : p.d ? `시든 ${CROP_INFO[p.d].name}` : '빈 칸';
/** The game's own crop art (the 텃밭 장부's stages), not emoji (D10). Growth 0–4 → 씨앗·새싹·자라는 중·다 자람. */
function PlotFace({ p }: { p: SitePlotView | undefined }) {
  if (p?.c) return <CropStageArt crop={p.c} stage={p.r ? 3 : Math.min(2, p.g)} size={30} />;
  if (p?.d)
    return (
      <span className="l-farm-site-dead">
        <CropStageArt crop={p.d} stage={1} size={24} />
      </span>
    );
  return null;
}
const costText = (c: FacilityCost) =>
  [c.beom ? formatBeom(c.beom) : '', ...Object.entries(c.mats).map(([id, n]) => `${itemName(id)} ${n}`)].filter(Boolean).join(' · ');

/** One thing a site window can do; `todo` counts what is waiting for it (ripe tiles, thirsty tiles…). */
type SiteAct = { id: string; label: ReactNode; todo: number; disabled?: boolean; onClick: () => void; before?: ReactNode; ghost?: boolean };

/**
 * D10: a big window shows one main action — the first in `acts` with
 * something to do (else the first that can run) — and folds the rest under
 * 더 보기, which says how many of them have work waiting.
 */
function ActionSet({ acts, busy }: { acts: readonly SiteAct[]; busy: boolean }) {
  const main = acts.find((a) => a.todo > 0) ?? acts.find((a) => !a.disabled) ?? acts[0];
  if (!main) return null;
  const rest = acts.filter((a) => a !== main);
  const waiting = rest.filter((a) => a.todo > 0).length;
  return (
    <>
      {main.before}
      <span className="l-town-buttons l-farm-site-actions">
        <GameButton variant="primary" disabled={busy || !!main.disabled} onClick={main.onClick} data-testid={`site-act-${main.id}`}>
          {main.label}
        </GameButton>
      </span>
      {rest.length > 0 && (
        <MoreActions hint={waiting ? `할 수 있는 일 ${waiting}` : undefined} data-testid="site-more">
          {rest.map((a) => (
            <Fragment key={a.id}>
              {a.before}
              <GameButton size="s" variant={a.ghost ? 'ghost' : undefined} disabled={busy || !!a.disabled} onClick={a.onClick} data-testid={`site-act-${a.id}`}>
                {a.label}
              </GameButton>
            </Fragment>
          ))}
        </MoreActions>
      )}
    </>
  );
}

/** Seeds I hold that may go in now (any season inside a greenhouse; in season on the shared field). */
const seedsFor = (view: CloudRoomView, anySeason: boolean) => {
  const seeds = view.life!.me.bag.seeds,
    season = view.life!.calendar?.season ?? 'spring';
  return CROPS.filter((c) => (seeds[c] ?? 0) > 0 && (anySeason || cropInSeason(c, season)));
};

export function FarmSitePanel({ room, view, notify, target, onClose }: Props) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const act: Run = (a, done) => void run(a, done, 'plant');
  if (!life) {
    return (
      <Modal title="우리 농장" onClose={onClose} panel="plain">
        <EmptyState glyph="sprout" title="마을에 접속한 뒤 이용할 수 있어요" />
      </Modal>
    );
  }
  const me = life.actors[view.self] ?? 0;
  const sites = life.farmSites;
  const ctx = { room, view, notify, act, busy, me, sites };
  if (target.kind === 'common')
    return (
      <Modal title="공동 밭" onClose={onClose} panel="plain" wide className="l-farm-site">
        <CommonPage {...ctx} />
      </Modal>
    );
  if (target.kind === 'store')
    return (
      <Modal title="공동 창고" onClose={onClose} panel="plain" className="l-farm-site">
        <StorePage {...ctx} />
      </Modal>
    );
  const size = siteSize(target.id),
    owner = siteActor(target.id),
    v = sites?.sites.find((s) => s.id === target.id);
  const def = v ? FACILITY_BY_ID[v.k] : null;
  const title = def ? (v?.o !== undefined && v.o !== me ? `${ACTORS[v.o] ?? '친구'}의 ${def.name}` : def.name) : owner !== null ? (owner === me ? '내 부지' : `${ACTORS[owner] ?? '친구'}의 부지`) : `빈 ${SITE_SIZE_NAME[size ?? 'small']}`;
  return (
    <Modal title={title} onClose={onClose} panel="plain" wide={!!def && def.id !== 'machineYard'} className="l-farm-site">
      {!v ? (
        <BuildList {...ctx} id={target.id} />
      ) : v.t < 1 ? (
        <Funding {...ctx} id={target.id} v={v} def={def!} />
      ) : (
        <Built {...ctx} id={target.id} v={v} def={def!} onClose={onClose} />
      )}
    </Modal>
  );
}

type Ctx = { view: CloudRoomView; act: Run; busy: boolean; me: number; sites: FarmSitesView | undefined };

/** What can stand on an empty site: unlock, cost, and the button that builds or starts the funding. */
function BuildList({ view, act, busy, me, id }: Ctx & { id: string }) {
  const life = view.life!;
  const owner = siteActor(id);
  if (owner !== null && owner !== me) return <EmptyState glyph="house" title={`${ACTORS[owner] ?? '친구'}의 부지예요`} hint="친구가 직접 시설을 지을 수 있어요." />;
  const ctx = { flags: life.flags ?? [], level: (s: string) => life.growth?.skills.find((x) => x.id === s)?.level ?? 1 };
  const inv = life.me.inv ?? {},
    balance = view.wallet.balance;
  const built = new Set((life.farmSites?.sites ?? []).map((s) => s.k));
  const rows = facilitiesFor(id).map((def) => {
    const lock = unlockBlock(def, ctx as Parameters<typeof unlockBlock>[1]) ?? (def.owner === 'shared' && built.has(def.id) ? '이미 농장에 있어요' : null);
    const short =
      def.owner === 'personal' && !lock
        ? balance < def.build.beom
          ? '범이 모자라요'
          : Object.entries(def.build.mats).find(([m, n]) => (inv[m] ?? 0) < n)
            ? '재료가 모자라요'
            : null
        : null;
    return { def, lock, short };
  });
  const row = ({ def, lock, short }: (typeof rows)[number]) => (
    <li key={def.id} className="l-town-row" data-testid={`site-build-${def.id}`}>
      <span className="l-town-art" aria-hidden="true">
        <Glyph name={lock ? 'lock' : def.live ? 'construction' : 'lock'} size={24} />
      </span>
      <div>
        <strong>{def.name}</strong>
        <small>{def.note}</small>
        <small>
          {unlockText(def) ? `열림: ${unlockText(def)} · ` : '처음부터 · '}
          {costText(def.build)}
          {def.upgrades?.length ? ` · ${maxTier(def)}단계까지` : ''}
        </small>
      </div>
      <GameButton
        size="s"
        variant={lock || short ? undefined : 'primary'}
        disabled={busy || !!lock || !!short}
        onClick={() =>
          act(
            { kind: 'siteBuild', site: id, facility: def.id },
            def.owner === 'personal' ? `${josa(def.name, '을/를')} 지었어요!` : `${def.name} 공사를 시작했어요. 친구들과 범과 재료를 보태 주세요.`,
          )
        }
      >
        {lock ?? short ?? (def.owner === 'personal' ? '짓기' : '공사 시작')}
      </GameButton>
    </li>
  );
  // D10: what can be built now stays in view; locked ones fold under 더 보기.
  const open = rows.filter((r) => !r.lock),
    locked = rows.filter((r) => r.lock);
  return (
    <>
      <p className="l-farm-site-note">
        {owner !== null
          ? '내 집 밭 아래의 작은 부지예요. 개인 시설은 혼자 짓고, 헐면 재료 절반을 돌려받아요.'
          : '공용 시설은 친구들이 범과 재료를 나눠 내서 지어요(마을 개척처럼). 헐면 낸 재료의 절반이 낸 사람에게 돌아가요.'}
      </p>
      {open.length ? (
        <ul className="l-town-list" aria-label="지을 수 있는 시설">
          {open.map(row)}
        </ul>
      ) : (
        <p className="l-farm-site-note">아직 지을 수 있는 시설이 없어요.</p>
      )}
      {locked.length > 0 && (
        <MoreActions label="아직 못 짓는 시설" hint={`${locked.length}곳`} open={!open.length} className="l-farm-site-more">
          <ul className="l-town-list" aria-label="아직 못 짓는 시설">
            {locked.map(row)}
          </ul>
        </MoreActions>
      )}
    </>
  );
}

/** A shared funding (build or the next tier): 범 and each material, like 마을 개척. */
function FundBox({ view, act, busy, id, v, def }: Ctx & { id: string; v: SiteView; def: FacilityDef }) {
  const f = v.fund!;
  const cost = tierCost(def, f.to)!;
  const inv = view.life!.me.inv ?? {},
    balance = view.wallet.balance,
    left = cost.beom - f.got;
  return (
    <section className="l-town-notice" aria-label="공사 기금" data-testid="site-fund">
      <strong>
        {f.to === 1 ? `${def.name} 짓기` : `${f.to}단계로 넓히기`} · {formatBeom(f.got)} / {formatBeom(cost.beom)}
      </strong>
      <p>
        보탠 친구: {f.by.length ? f.by.map((a) => ACTORS[a] ?? '친구').join(', ') : '아직 없어요'}
        {f.to > 1 ? ` · ${def.upgrades?.find((u) => u.tier === f.to)?.effect ?? ''}` : ''}
      </p>
      {left > 0 && (
        <span className="l-town-buttons">
          {[SITE_MIN_BEOM * 10, SITE_MIN_BEOM * 50, left].filter((n, i, all) => n <= left && all.indexOf(n) === i).map((n) => (
            <GameButton key={n} size="s" disabled={busy || balance < n} onClick={() => act({ kind: 'siteGive', site: id, beom: n }, `${formatBeom(n)}을 보탰어요.`)}>
              {n === left ? `남은 ${formatBeom(n)}` : formatBeom(n)}
            </GameButton>
          ))}
        </span>
      )}
      <ul className="l-farm-site-mats" aria-label="재료">
        {Object.entries(cost.mats).map(([m, need]) => {
          const got = f.mat[m] ?? 0,
            have = inv[m] ?? 0,
            give = Math.min(have, need - got);
          return (
            <li key={m}>
              <span>
                {itemName(m)} {got}/{need} <small>(가방 {have})</small>
              </span>
              <GameButton size="s" disabled={busy || give < 1} onClick={() => act({ kind: 'siteGive', site: id, item: m, n: give }, `${itemName(m)} ${give}개를 보탰어요.`)}>
                {got >= need ? '다 모였어요' : give ? `${give}개 보태기` : '없어요'}
              </GameButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Funding(props: Ctx & { id: string; v: SiteView; def: FacilityDef }) {
  const { act, busy, id, v } = props;
  const empty = !v.fund || (v.fund.got === 0 && !Object.keys(v.fund.mat).length);
  return (
    <>
      <p className="l-farm-site-note">{props.def.note}</p>
      <FundBox {...props} />
      {empty && (
        <GameButton size="s" variant="ghost" disabled={busy} onClick={() => act({ kind: 'siteDemolish', site: id }, '공사 계획을 접었어요.')}>
          공사 계획 접기
        </GameButton>
      )}
    </>
  );
}

function Built(props: Ctx & { id: string; v: SiteView; def: FacilityDef; onClose: () => void }) {
  const { view, act, busy, me, id, v, def } = props;
  const [demolish, setDemolish] = useState(false);
  const mine = def.owner === 'shared' || v.o === me;
  const next = tierCost(def, v.t + 1);
  const balance = view.wallet.balance,
    inv = view.life!.me.inv ?? {};
  const canPay = !!next && balance >= next.beom && Object.entries(next.mats).every(([m, n]) => (inv[m] ?? 0) >= n);
  // F4 (§11-5): 닭장 증축 needs 목축 Lv3, 축사 2층 Lv7 (whoever starts it).
  const upNeed = def.upgrades?.find((u) => u.tier === v.t + 1)?.need;
  const need = upNeed
    ? {
        label: `${SKILL_INFO[upNeed.skill].name} Lv${upNeed.level}부터`,
        short: (view.life!.growth?.skills.find((x) => x.id === upNeed.skill)?.level ?? 1) < upNeed.level,
      }
    : null;
  const life = view.life!;
  // F5: a tier may need a level (양식장 중간 연못: 낚시 Lv8).
  const tierLock = next ? upgradeBlock(def, v.t + 1, { flags: life.flags ?? [], level: (s) => life.growth?.skills.find((x) => x.id === s)?.level ?? 1 }) : null;
  // Facilities with a page of their own keep its action as the main one.
  const pond = def.id === 'fishPond' ? v.pond : undefined;
  const ownPage = ['greenhouse', 'greenhouseMini', 'orchardPlot', 'barn', 'coop', 'fishPond', 'seedLab'].includes(def.id);
  const upgrade = (main: boolean) =>
    next && (
      <section className="l-town-notice" aria-label="넓히기">
        <strong>
          {v.t + 1}단계 · {def.upgrades?.find((u) => u.tier === v.t + 1)?.effect}
        </strong>
        <p>
          {costText(next)}
          {need && ` · ${need.label}`}
        </p>
        <GameButton
          size="s"
          variant={main ? 'primary' : undefined}
          disabled={busy || !!tierLock || !!need?.short || (def.owner === 'personal' && !canPay)}
          onClick={() => act({ kind: 'siteUpgrade', site: id }, def.owner === 'personal' ? '넓혔어요!' : '넓히는 공사를 시작했어요. 친구들과 보태 주세요.')}
        >
          {tierLock ?? (need?.short ? `${need.label} 넓힐 수 있어요` : def.owner === 'personal' ? (canPay ? '넓히기' : '범이나 재료가 모자라요') : '넓히는 공사 시작')}
        </GameButton>
      </section>
    );
  return (
    <>
      {def.id === 'greenhouse' || def.id === 'greenhouseMini' ? (
        <Greenhouse {...props} mine={mine} />
      ) : def.id === 'orchardPlot' ? (
        <Orchard {...props} mine={mine} />
      ) : def.id === 'barn' || def.id === 'coop' ? (
        <FarmBarn view={view} act={act} busy={busy} kind={def.id} />
      ) : def.id === 'fishPond' ? (
        <Pond {...props} mine={mine} />
      ) : def.id === 'seedLab' ? (
        <SeedLab {...props} mine={mine} />
      ) : def.id === 'machineYard' ? (
        <section className="l-town-notice" aria-label="가공 마당">
          <strong>
            {v.t}단계 · 친구마다 기계 칸 {slotsAt(def, v.t)}개
          </strong>
          <p>기계는 텃밭 창의 ‘가공’ 탭에서 놓고 거둬요. 놓은 기계는 모두 이 마당에 서요.</p>
        </section>
      ) : (
        <p className="l-farm-site-note">{def.note}</p>
      )}
      {mine && v.fund && <FundBox {...props} />}
      {mine && !v.fund && next && !ownPage && upgrade(true)}
      {mine && (
        // D10: the facility's own page (or 넓히기) is the main action; managing it folds away.
        <MoreActions label={[ownPage && !v.fund && next ? '넓히기' : '', pond ? '비우기' : '', '헐기'].filter(Boolean).join(' · ')} className="l-farm-site-more" data-testid="site-manage">
          {ownPage && !v.fund && next && upgrade(false)}
          {pond && (
            // 양식장: emptying it lives with the other ways of managing the site.
            <GameButton size="s" variant="ghost" disabled={busy || pond.o.length > 0} onClick={() => act({ kind: 'pondEmpty', site: id }, `양식장을 비웠어요. 처음 넣은 ${itemName(pond.f)}은 가방으로 돌아왔어요.`)}>
              비우기
            </GameButton>
          )}
          <GameButton size="s" variant="ghost" disabled={busy} onClick={() => setDemolish(true)}>
            헐기
          </GameButton>
        </MoreActions>
      )}
      {demolish && (
        <ConfirmModal
          title={`${def.name} 헐기`}
          body="헐면 지을 때 낸 재료의 절반이 낸 사람에게 돌아가요. 범은 돌아오지 않아요."
          consequences={def.id === 'orchardPlot' ? ['심은 나무도 함께 사라져요.'] : def.id === 'fishPond' ? ['물고기를 먼저 내보내야 헐 수 있어요.'] : undefined}
          confirmLabel="헐기"
          danger
          onConfirm={() => {
            act({ kind: 'siteDemolish', site: id }, `${josa(def.name, '을/를')} 헐었어요. 재료 절반을 돌려받았어요.`);
            props.onClose();
          }}
          onClose={() => setDemolish(false)}
        />
      )}
    </>
  );
}

/** Seeds I hold (any season inside a greenhouse; in season on the shared field). */
function SeedPick({ view, anySeason, value, onChange }: { view: CloudRoomView; anySeason: boolean; value: Crop | null; onChange: (c: Crop) => void }) {
  const seeds = view.life!.me.bag.seeds;
  const have = seedsFor(view, anySeason);
  if (!have.length) return <p className="l-farm-site-note">심을 씨앗이 없어요. 시장 거리 등불 잡화점에서 사 와요.</p>;
  return (
    <span className="l-farm-site-seeds" role="radiogroup" aria-label="씨앗">
      {have.map((c) => (
        <GameButton key={c} size="s" variant={value === c ? 'primary' : undefined} aria-pressed={value === c} onClick={() => onChange(c)}>
          <ItemIcon id={c} size={20} /> {CROP_INFO[c].name} {seeds[c]}
        </GameButton>
      ))}
    </span>
  );
}

/** `owners`: label whose crop a tile is (the shared greenhouse); `tilled`: the shared field's tilled tiles (others are grass). */
function PlotGrid({ cols, n, plots, me, owners = false, tilled }: { cols: number; n: number; plots: readonly SitePlotView[]; me: number; owners?: boolean; tilled?: ReadonlySet<number> }) {
  const byTile = new Map(plots.map((p) => [p.t, p]));
  return (
    <ol className="l-farm-site-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-label="칸">
      {Array.from({ length: n }, (_, t) => {
        const p = byTile.get(t);
        const who = owners && p?.c ? (p.o === undefined ? '공용' : p.o === me ? '내 작물' : `${ACTORS[p.o] ?? '친구'}`) : '';
        const grass = !!tilled && !tilled.has(t);
        return (
          <li key={t} className={`l-farm-site-tile${p?.r ? ' is-ready' : ''}${owners && p?.o === me ? ' is-mine' : ''}${grass ? ' is-grass' : ''}`} title={`${t + 1}번 칸 · ${grass ? '아직 갈지 않았어요' : plotLabel(p)}${who ? ` · ${who}` : ''}`}>
            <span aria-hidden="true">
              <PlotFace p={p} />
            </span>
            {who && <small>{who}</small>}
          </li>
        );
      })}
    </ol>
  );
}

function Greenhouse({ view, act, busy, me, id, v, def, mine }: Ctx & { id: string; v: SiteView; def: FacilityDef; mine: boolean }) {
  const [seed, setSeed] = useState<Crop | null>(null);
  const plots = v.p ?? [];
  const n = slotsAt(def, v.t),
    shared = def.id === 'greenhouse';
  const myCount = plots.filter((p) => p.c && p.o === me).length;
  const ripe = plots.filter((p) => p.r && (!shared || p.o === undefined || p.o === me)).length;
  const thirsty = plots.filter((p) => p.c && !p.w && !p.r).length;
  const empty = n - plots.filter((p) => p.c).length;
  const canSow = seedsFor(view, true).length > 0;
  return (
    <>
      <p className="l-farm-site-note">
        {shared
          ? `온실 안에서는 계절과 상관없이 자라요. 한 사람 ${GREENHOUSE_PER_FRIEND}칸까지 내 작물(내 가방으로), 남는 칸은 공용 작물(공동 창고로). 지금 내 칸 ${myCount}/${GREENHOUSE_PER_FRIEND}.`
          : '내 온실이에요. 계절과 상관없이 자라요.'}
      </p>
      <PlotGrid cols={shared ? 6 : 4} n={n} plots={plots} me={me} owners={shared} />
      {mine ? (
        <ActionSet
          busy={busy}
          acts={[
            { id: 'harvest', label: `거두기${ripe ? ` (${ripe})` : ''}`, todo: ripe, disabled: !ripe, onClick: () => act({ kind: 'siteHarvest', site: id, tile: -1 }, '온실 작물을 거뒀어요.') },
            { id: 'water', label: `물 주기${thirsty ? ` (${thirsty})` : ''}`, todo: thirsty, disabled: !thirsty, onClick: () => act({ kind: 'siteWater', site: id, tile: -1 }, '온실에 물을 줬어요.') },
            {
              id: 'plant',
              label: shared ? '내 칸에 심기' : '빈 칸 모두 심기',
              todo: canSow && !(shared && myCount >= GREENHOUSE_PER_FRIEND) ? empty : 0,
              disabled: !seed || !empty || (shared && myCount >= GREENHOUSE_PER_FRIEND),
              before: <SeedPick view={view} anySeason value={seed} onChange={setSeed} />,
              onClick: () => seed && act({ kind: 'sitePlant', site: id, tile: -1, crop: seed }, `${CROP_INFO[seed].name}을 심었어요.`),
            },
            ...(shared
              ? [
                  {
                    id: 'plant-shared',
                    label: '공용으로 심기',
                    todo: 0,
                    disabled: !seed || !empty,
                    onClick: () => seed && act({ kind: 'sitePlant', site: id, tile: -1, crop: seed, shared: true }, `공용으로 ${CROP_INFO[seed].name}을 심었어요.`),
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </>
  );
}

function Orchard({ view, act, busy, id, v, def, mine }: Ctx & { id: string; v: SiteView; def: FacilityDef; mine: boolean }) {
  const today = kstDay(useNow(true, 60_000) + view.clockOffset);
  const season = view.life!.calendar?.season ?? 'spring';
  const trees = new Map((v.tr ?? []).map((t) => [t.s, t]));
  const fruit = (v.tr ?? []).reduce((s, t) => s + t.n, 0);
  return (
    <>
      <p className="l-farm-site-note">
        묘목을 심고 {ORCHARD_PLOT_DAYS}일 뒤부터 제철마다 매일 과일이 하나씩 열려요. 나무마다 {ORCHARD_PLOT_HOLD}개까지 달려요.
      </p>
      <ul className="l-town-list" aria-label="과일나무">
        {Array.from({ length: slotsAt(def, v.t) }, (_, slot) => {
          const t = trees.get(slot);
          return (
            <li key={slot} className="l-town-row" data-testid={`orchard-slot-${slot}`}>
              <span className="l-town-art" aria-hidden="true">
                {t ? <Glyph name={today >= t.from ? 'tree' : 'sprout'} size={24} /> : <Glyph name="pin" size={16} />}
              </span>
              <div>
                <strong>{t ? SAPLINGS[t.f].name : `${slot + 1}번 자리 · 비어 있어요`}</strong>
                <small>
                  {!t
                    ? '묘목을 심어 주세요'
                    : today < t.from
                      ? `${t.from - today}일 뒤부터 열려요 · 제철 ${SEASON_INFO[SAPLINGS[t.f].season].name}`
                      : SAPLINGS[t.f].season !== season
                        ? `제철이 아니에요 · 제철 ${SEASON_INFO[SAPLINGS[t.f].season].name}`
                        : `열매 ${t.n}/${ORCHARD_PLOT_HOLD}`}
                </small>
              </div>
              {mine &&
                (t ? (
                  <GameButton size="s" variant="ghost" disabled={busy} onClick={() => act({ kind: 'siteTree', site: id, slot, clear: true }, '나무를 베었어요.')}>
                    베기
                  </GameButton>
                ) : (
                  // D10: the sapling choices fold per empty spot (was every kind × every spot in view).
                  <MoreActions label="묘목 심기" className="l-farm-site-more">
                    {FRUIT_TREE_KINDS.map((k: FruitTreeKind) => (
                      <GameButton key={k} size="s" disabled={busy || view.wallet.balance < SAPLINGS[k].price} onClick={() => act({ kind: 'siteTree', site: id, slot, tree: k }, `${josa(SAPLINGS[k].name, '을/를')} 심었어요.`)}>
                        {itemName(k)} {formatBeom(SAPLINGS[k].price)}
                      </GameButton>
                    ))}
                  </MoreActions>
                ))}
            </li>
          );
        })}
      </ul>
      {mine && (
        <GameButton variant="primary" disabled={busy || !fruit} onClick={() => act({ kind: 'siteFruit', site: id }, `과일 ${fruit}개를 땄어요. 가방에 담았어요.`)}>
          {fruit ? `과일 따기 (${fruit})` : '딸 과일이 없어요'}
        </GameButton>
      )}
    </>
  );
}

/** F5 양식장: stock it with a fish from my bag, see it grow, collect fish and roe, meet its requests. */
function Pond({ view, act, busy, id, v, mine }: Ctx & { id: string; v: SiteView; def: FacilityDef; mine: boolean }) {
  const today = kstDay(useNow(true, 60_000) + view.clockOffset);
  const inv = view.life!.me.inv ?? {};
  const p = v.pond;
  if (!p) {
    const fish = Object.entries(inv)
      .filter(([id2, n]) => n > 0 && pondFishOk(FISH_BY_ID[id2]))
      .sort(([a], [b]) => FISH_BY_ID[b].sell - FISH_BY_ID[a].sell);
    return (
      <>
        <p className="l-farm-site-note">내가 잡은 물고기 한 마리를 넣으면 그 물고기의 양식장이 돼요. 전설 물고기와 먼바다 대형 어종은 넣을 수 없어요.</p>
        {!mine ? null : fish.length ? (
          <span className="l-farm-site-seeds" aria-label="넣을 물고기">
            {fish.map(([f, n]) => (
              <GameButton key={f} size="s" disabled={busy} onClick={() => act({ kind: 'pondStock', site: id, fish: f }, `${josa(itemName(f), '을/를')} 양식장에 넣었어요.`)}>
                {itemName(f)} {n}
              </GameButton>
            ))}
          </span>
        ) : (
          <EmptyState glyph="fish" title="넣을 물고기가 없어요" hint="강·바다·호수에서 한 마리 잡아 와요." />
        )}
      </>
    );
  }
  const name = itemName(p.f);
  return (
    <>
      <section className="l-town-notice" aria-label="양식장" data-testid="pond">
        <strong>
          {name} {p.n}/{p.cap}마리{p.cap < p.max ? ` (최대 ${p.max})` : ''}
        </strong>
        <p>
          {p.n < p.cap ? `${Math.max(0, p.growAt - today)}일 뒤 한 마리 늘어요(${POND_GROW_DAYS}일마다). ` : '지금은 꽉 찼어요. '}
          매일 {name} 한 마리나 어란 하나가 나와요(마리가 많을수록 자주). {POND_HOLD}개까지 모아 둬요. 양식한 물고기도 같은 종류는 하루 4마리까지 제값이에요.
        </p>
      </section>
      {p.want && (
        <section className="l-town-notice" aria-label="양식장이 바라는 것">
          <strong>
            <Glyph name="chat" size={16} /> {p.want.name} {p.want.n}개가 있으면 좋겠어요
          </strong>
          <p>가져다주면 물고기를 한 마리 더 키울 수 있어요.</p>
          {mine && (
            <GameButton size="s" disabled={busy} onClick={() => act({ kind: 'pondGive', site: id }, `${p.want!.name} ${p.want!.n}개를 줬어요. 양식장이 넓어졌어요.`)}>
              건네기
            </GameButton>
          )}
        </section>
      )}
      {mine && (
        <span className="l-town-buttons l-farm-site-actions">
          <GameButton variant="primary" disabled={busy || !p.o.length} onClick={() => act({ kind: 'pondCollect', site: id }, `${p.o.map((o) => itemName(o)).join(', ')}을(를) 거뒀어요.`)}>
            {p.o.length ? `거두기 (${p.o.map((o) => (isRoeId(o) ? itemName(o) : '물고기')).join(' · ')})` : '아직 거둘 게 없어요'}
          </GameButton>
        </span>
      )}
    </>
  );
}

/** F5 품종 개량소: five crops of a kind → one improved seed (twice a day). */
function SeedLab({ view, act, busy, id, v, def, mine }: Ctx & { id: string; v: SiteView; def: FacilityDef; mine: boolean }) {
  const now = useNow(true, 30_000) + view.clockOffset;
  const lab = v.lab ?? { q: [], today: 0, perDay: 2, input: 5 };
  const life = view.life!;
  const produce = life.me.bag.produce;
  const ready = lab.q.filter((b) => b.done <= now).length;
  const full = lab.q.length >= slotsAt(def, v.t) || lab.today >= lab.perDay;
  const crops = CROPS.filter((c) => (produce[c] ?? 0) >= lab.input);
  const improved = life.farmx?.improved ?? [];
  const loadList = crops.length ? (
    <span className="l-farm-site-seeds" aria-label="넣을 작물">
      {crops.map((c) => (
        <GameButton key={c} size="s" disabled={busy || full} onClick={() => act({ kind: 'labLoad', site: id, crop: c }, `${CROP_INFO[c].name} ${lab.input}개를 넣었어요.`)}>
          <ItemIcon id={c} size={20} /> {CROP_INFO[c].name} {produce[c]}
        </GameButton>
      ))}
    </span>
  ) : (
    <p className="l-farm-site-note">같은 작물이 {lab.input}개 이상 있어야 해요.</p>
  );
  return (
    <>
      <p className="l-farm-site-note">
        같은 작물 {lab.input}개를 넣으면 {Math.round(SEEDLAB_MS / 3_600_000)}시간 뒤 개량 씨앗 1개가 나와요. 하루 {lab.perDay}번까지예요. 개량 씨앗으로 심으면 금별 확률 +{IMPROVED_GOLD_PTS}%p, 한 두둑(3×2)을 다 개량 씨앗으로 한꺼번에 심으면 대형 작물이 두 배로 잘 돼요.
      </p>
      <section className="l-town-notice" aria-label="개량 중">
        <strong>
          오늘 {lab.today}/{lab.perDay}번
        </strong>
        <p>{lab.q.length ? lab.q.map((b) => `${CROP_INFO[b.c].name} ${b.done <= now ? '다 됐어요' : `${Math.ceil((b.done - now) / 60_000)}분 남음`}`).join(' · ') : '개량 중인 씨앗이 없어요.'}</p>
      </section>
      {mine && (
        <>
          {ready > 0 && (
            <span className="l-town-buttons l-farm-site-actions">
              <GameButton variant="primary" disabled={busy} onClick={() => act({ kind: 'labCollect', site: id }, `개량 씨앗 ${ready}개를 거뒀어요.`)}>
                개량 씨앗 거두기 ({ready})
              </GameButton>
            </span>
          )}
          {/* D10: with seeds to collect that is the main action and loading folds away; otherwise loading is it. */}
          {ready > 0 ? (
            <MoreActions label="작물 넣기" hint={crops.length ? `${crops.length}가지` : undefined} className="l-farm-site-more">
              {loadList}
            </MoreActions>
          ) : (
            loadList
          )}
        </>
      )}
      {improved.length > 0 && <p className="l-farm-site-note">가진 개량 씨앗: {improved.map((x) => `${CROP_INFO[x.crop].name} ${x.n}`).join(' · ')} (텃밭 장부에서 심어요)</p>}
    </>
  );
}

function CommonPage({ view, act, busy, me, sites }: Ctx) {
  const [seed, setSeed] = useState<Crop | null>(null);
  const field = sites?.field ?? { till: [], p: [], giants: [] };
  const goal = sites?.goal;
  const till = new Set(field.till);
  const planted = new Set(field.p.filter((p) => p.c).map((p) => p.t));
  const openTilled = [...till].filter((t) => !planted.has(t)).length;
  const ripe = field.p.filter((p) => p.r).length,
    thirsty = field.p.filter((p) => p.c && !p.w && !p.r).length;
  const canSow = seedsFor(view, false).length > 0;
  // D10: the grid on the left, the goal and the one next job on the right (the right half was empty).
  return (
    <div className="l-farm-site-split">
      <PlotGrid cols={6} n={36} plots={field.p} me={me} tilled={till} />
      <div className="l-farm-site-side">
        <section className="l-town-notice" aria-label="마을 대형 작물" data-testid="common-goal">
          <strong>
            이번 계절 마을 대형 작물 · {goal?.crop ?? '대형 작물'} {goal?.n ?? 0}/{goal?.need ?? COMMON_GOAL_GIANTS}
            {goal?.done ? ' · 이뤘어요!' : ''}
          </strong>
          <p>
            호박·수박·양배추를 3×2 묶음으로 한꺼번에 심으면 공동 밭에서는 대형 작물이 더 잘 나와요. 목표를 이루면 함께한 친구 모두 마을 공사 현판과 농사 경험치를 받아요.
            {goal?.by.length ? ` 함께한 친구: ${goal.by.map((a) => ACTORS[a] ?? '친구').join(', ')}` : ''}
          </p>
        </section>
        <p className="l-farm-site-note">누구나 갈고 심고 물 주고 거둘 수 있어요. 거둔 것은 공동 창고로 가서 꾸러미와 축제 기금에 써요. 씨앗은 심는 사람이 내요.</p>
        <ActionSet
          busy={busy}
          acts={[
            { id: 'harvest', label: `거두기${ripe ? ` (${ripe})` : ''}`, todo: ripe, disabled: !ripe, onClick: () => act({ kind: 'commonHarvest', tile: -1 }, '공동 밭을 거뒀어요. 공동 창고에 넣었어요.') },
            { id: 'water', label: `물 주기${thirsty ? ` (${thirsty})` : ''}`, todo: thirsty, disabled: !thirsty, onClick: () => act({ kind: 'commonWater', tile: -1 }, '공동 밭에 물을 줬어요.') },
            {
              id: 'plant',
              label: `빈 칸 심기${openTilled ? ` (${openTilled})` : ''}`,
              todo: canSow ? openTilled : 0,
              disabled: !seed || !openTilled,
              before: <SeedPick view={view} anySeason={false} value={seed} onChange={setSeed} />,
              onClick: () => seed && act({ kind: 'commonPlant', tile: -1, crop: seed }, `공동 밭에 ${CROP_INFO[seed].name}을 심었어요.`),
            },
            { id: 'till', label: `모두 갈기${till.size < 36 ? ` (${36 - till.size})` : ''}`, todo: 36 - till.size, disabled: till.size >= 36, onClick: () => act({ kind: 'commonTill', tile: -1 }, '공동 밭을 갈았어요.') },
          ]}
        />
      </div>
    </div>
  );
}

function StorePage({ view, act, busy, sites }: Ctx) {
  const store = sites?.store ?? [];
  const life = view.life!;
  const fest = life.festival;
  const festLeft = fest ? Math.max(0, fest.goal - fest.got) : 0;
  // Bundle crop slots the store can fill now.
  const wants = BUNDLES.flatMap((b) => {
    const state = life.bundles?.find((x) => x.id === b.id);
    if (state?.done) return [];
    return b.slots.flatMap((slot, i) => {
      if (!('item' in slot) || !(CROPS as string[]).includes(slot.item)) return [];
      const left = slot.n - (state?.got[i] ?? 0),
        q = slot.q ?? 0,
        have = store.filter((s) => s.id === slot.item && s.q >= q).reduce((t, s) => t + s.n, 0);
      return left > 0 && have > 0 ? [{ bundle: b, slot: i, item: slot.item as Crop, q, n: Math.min(left, have) }] : [];
    });
  });
  if (!store.length) return <EmptyState glyph="pot" title="공동 창고가 비어 있어요" hint="공동 밭과 온실의 공용 칸에서 거둔 작물이 여기 모여요." />;
  return (
    <>
      <ul className="l-town-list" aria-label="공동 창고">
        {store.map((s) => (
          <li key={`${s.id}@${s.q}`} className="l-town-row">
            <span className="l-town-art" aria-hidden="true">
              <ItemIcon id={s.id} size={32} />
            </span>
            <div>
              <strong>
                {itemName(s.id)} {s.q ? `· ${QUALITY_NAME[s.q]}` : ''}
              </strong>
              <small>{s.n}개</small>
            </div>
            <GameButton
              size="s"
              disabled={busy || !festLeft || !!fest?.done}
              onClick={() => act({ kind: 'festival', n: s.n, item: s.id, q: s.q }, `이번 주 마을 축제 기금에 ${itemName(s.id)}을 냈어요.`)}
            >
              {fest?.done ? '축제 기금 다 모였어요' : '축제 기금에 내기'}
            </GameButton>
          </li>
        ))}
      </ul>
      {wants.length > 0 && (
        <section className="l-town-notice" aria-label="꾸러미에 내기">
          <strong>꾸러미에 낼 수 있어요</strong>
          <span className="l-farm-site-seeds">
            {wants.map((w) => (
              <GameButton
                key={`${w.bundle.id}-${w.slot}`}
                size="s"
                disabled={busy}
                onClick={() => act({ kind: 'contribute', bundle: w.bundle.id, slot: w.slot, n: w.n, from: 'store' }, `${w.bundle.name}에 ${itemName(w.item)} ${w.n}개를 냈어요.`)}
              >
                {w.bundle.name} · {itemName(w.item)} {w.n}개
              </GameButton>
            ))}
          </span>
        </section>
      )}
    </>
  );
}
