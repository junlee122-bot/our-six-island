'use client';
// 성장 수첩 (T): the growth window as a leather-strapped field journal like the
// 텃밭 장부 — bookmark ribbons for 기술 · 도구 · 마을 개척, the left page lists,
// the right page details, and a “오늘 할 수 있는 것” strip. Keyboard: 1–3 or
// Tab/Shift+Tab switch ribbons (while the journal has focus), ↑↓ pick a row,
// Enter acts (choose a profession, go to the blacksmith), Esc closes.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  LEVEL_PERKS,
  MAX_LEVEL,
  NODE_INFO,
  PROF_BY_ID,
  RESPEC_PRICE,
  SKILLS,
  SKILL_INFO,
  TIER_NAME,
  TOOLS,
  TOOL_INFO,
  profChoices,
  type NodeKind,
  type SkillId,
  type ToolTier,
} from '../lounge-growth-data';
import type { GrowthView, SkillView, ToolView } from '../lounge-growth';
import { ITEM_BY_ID } from '../lounge-items';
import { ROD_PRICE } from '../lounge-life-plus';
import { formatBeom, josa } from '../lounge-text';
import { lifeSfx } from '../lounge-audio-life';
import { FORGE_FRONT, nodeFront } from '../lounge-village-growth';
import type { VillagePoint } from '../lounge-village-layout';
import { ConfirmModal, Modal } from './Modal';
import { Glyph, type GlyphName } from './field-glyphs';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import { useServerClock } from './use-server-clock';
import { ResearchBoard } from './GrowthResearch';
import { SKILL_GLYPH, TOOL_GLYPH } from './growth-glyphs';
import './farm-fish.css';
import './growth.css';

export type GrowthTab = 'skills' | 'tools' | 'research';
const TABS: { id: GrowthTab; label: string; glyph: GlyphName }[] = [
  { id: 'skills', label: '기술', glyph: 'spark' },
  { id: 'tools', label: '도구', glyph: 'anvil' },
  { id: 'research', label: '마을 개척', glyph: 'sign' },
];
const NODE_GLYPH: Record<NodeKind, GlyphName> = { bush: 'bush', log: 'log', rock: 'rock' };

function untilText(ms: number) {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간` : `${h}시간 ${m % 60 ? `${m % 60}분` : ''}`.trim();
}

/** What to do today (at most three lines). */
export function growthTodos(g: GrowthView, now: number) {
  const out: { glyph: GlyphName; text: string; key: string }[] = [];
  const pick = g.skills.find((s) => s.choice);
  if (pick) out.push({ glyph: 'spark', text: `${SKILL_INFO[pick.id].name} 전문가를 고를 수 있어요`, key: 'prof' });
  if (g.forge?.ready) out.push({ glyph: 'anvil', text: `${TOOL_INFO[g.forge.tool].name}가 다 됐대요 · 대장간에서 찾아요`, key: 'pickup' });
  else if (g.forge) out.push({ glyph: 'anvil', text: `${TOOL_INFO[g.forge.tool].name} 두드리는 중 · ${untilText(g.forge.readyAt - now)} 뒤`, key: 'forging' });
  if (g.gift.available) out.push({ glyph: 'pickaxe', text: '촌장님 선물: 구리 곡괭이를 받을 수 있어요', key: 'gift' });
  const nodes = g.nodes.filter((n) => !n.taken).length;
  if (nodes) out.push({ glyph: 'bush', text: `마을 가장자리 재료 ${nodes}곳이 남았어요`, key: 'nodes' });
  const rested = g.skills.filter((s) => s.rest > 0).sort((a, b) => b.rest - a.rest)[0];
  if (rested) out.push({ glyph: 'moon', text: `쉬고 온 기운: ${SKILL_INFO[rested.id].name} XP 두 배 (${Math.round(rested.rest)} 남음)`, key: 'rest' });
  const research = g.research.find((r) => r.open && !r.full && !r.done);
  if (research && out.length < 3) out.push({ glyph: 'sign', text: '마을 개척 “대장간 재건”에 보탤 수 있어요', key: 'research' });
  return out.slice(0, 3);
}

export function GrowthPanel({
  room,
  view,
  notify,
  onClose,
  onWalk,
  simple = false,
  initialTab = 'skills',
  initialSkill,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  /** Walks there in the village (closing the journal). */
  onWalk?: (point: VillagePoint) => void;
  /** 간단 그래픽: material nodes are gathered from the list. */
  simple?: boolean;
  initialTab?: GrowthTab;
  initialSkill?: SkillId;
}) {
  const life = view.life;
  const g = life?.growth;
  const now = useServerClock(view.clockOffset, [g?.forge?.readyAt], 30_000);
  const [tab, setTab] = useState<GrowthTab>(initialTab);
  const [skillAt, setSkillAt] = useState(() => Math.max(0, SKILLS.indexOf(initialSkill ?? g?.skills.find((s) => s.choice)?.id ?? 'farm')));
  const [toolAt, setToolAt] = useState(0);
  const [choose, setChoose] = useState<SkillId | null>(null);
  const [respec, setRespec] = useState<SkillId | null>(null);
  const [run, busy] = useLifeAction(room, notify);
  const bookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => bookRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);
  const todos = useMemo(() => (g ? growthTodos(g, now) : []), [g, now]);
  if (!life || !g)
    return (
      <Modal title="성장 수첩" onClose={onClose} className="l-growth">
        <p className="l-ledger-empty">마을에 연결되면 성장 수첩을 펼칠 수 있어요. 서버가 업데이트되는 중일 수도 있어요.</p>
      </Modal>
    );
  const skill = g.skills[skillAt] ?? g.skills[0];
  const tool = g.tools[toolAt] ?? g.tools[0];
  const walk = (p: VillagePoint) => {
    if (!onWalk) return;
    onClose();
    onWalk(p);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement;
    const onRoot = target === e.currentTarget;
    if (!onRoot && target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    if (target.closest('.l-research')) {
      if (/^[123]$/.test(e.key)) {
        setTab(TABS[Number(e.key) - 1].id);
        e.preventDefault();
      }
      return;
    }
    let handled = true;
    if (/^[123]$/.test(e.key)) setTab(TABS[Number(e.key) - 1].id);
    else if (e.key === 'Tab' && onRoot) {
      const i = TABS.findIndex((t) => t.id === tab);
      setTab(TABS[(i + (e.shiftKey ? -1 : 1) + TABS.length) % TABS.length].id);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const d = e.key === 'ArrowDown' ? 1 : -1;
      if (tab === 'skills') setSkillAt((i) => (i + d + SKILLS.length) % SKILLS.length);
      else if (tab === 'tools') setToolAt((i) => (i + d + TOOLS.length) % TOOLS.length);
      else handled = false;
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (tab === 'skills' && skill.choice) setChoose(skill.id);
      else if (tab === 'tools' && onWalk && !simple) walk(FORGE_FRONT);
      else handled = false;
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  return (
    <Modal title="성장 수첩" onClose={onClose} className="l-growth" wide>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- 1–3, Tab, arrows and Enter move and act inside the journal. */}
      <div ref={bookRef} className="l-growth-book" tabIndex={-1} role="application" aria-roledescription="성장 수첩" onKeyDown={onKey} data-testid="growth-panel">
        <div className="l-growth-ribbons" role="tablist" aria-label="성장 수첩 쪽">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className="l-growth-ribbon"
              data-tab={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`growth-tab-${t.id}`}
            >
              <Glyph name={t.glyph} size={18} /> {t.label} <kbd>{i + 1}</kbd>
            </button>
          ))}
        </div>
        {tab === 'research' ? (
          <section className="l-growth-page l-growth-wide" aria-label="마을 개척">
            <ResearchBoard room={room} view={view} notify={notify} compact />
          </section>
        ) : (
          <>
            <section className="l-growth-page l-growth-left" aria-label={tab === 'skills' ? '기술 목록' : '도구 목록'}>
              {tab === 'skills' ? (
                <ul className="l-skill-list" aria-label="기술 (↑↓로 고르기)">
                  {g.skills.map((s, i) => (
                    <SkillRow key={s.id} s={s} selected={i === skillAt} onPick={() => setSkillAt(i)} onChoose={() => setChoose(s.id)} />
                  ))}
                </ul>
              ) : (
                <ul className="l-tool-rack" aria-label="도구 (↑↓로 고르기)">
                  {g.tools.map((t, i) => (
                    <ToolRow key={t.id} t={t} selected={i === toolAt} forging={g.forge?.tool === t.id ? g.forge : null} onPick={() => setToolAt(i)} />
                  ))}
                </ul>
              )}
              <footer className="l-growth-today" aria-label="오늘 할 수 있는 것">
                <h4>
                  <Glyph name="bell" size={16} /> 오늘 할 수 있는 것
                </h4>
                {todos.length ? (
                  <ul>
                    {todos.map((t) => (
                      <li key={t.key}>
                        <Glyph name={t.glyph} size={16} /> {t.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="l-ledger-aside">오늘은 느긋하게 둘러봐요. 무엇을 하든 조금씩 자라요.</p>
                )}
              </footer>
            </section>
            <section className="l-growth-page l-growth-right" aria-live="polite">
              {tab === 'skills' ? (
                <SkillDetail g={g} s={skill} onChoose={() => setChoose(skill.id)} onRespec={() => setRespec(skill.id)} />
              ) : (
                <ToolDetail
                  g={g}
                  t={tool}
                  now={now}
                  inv={life.me.inv ?? {}}
                  busy={busy}
                  balance={view.wallet.balance}
                  simple={simple || !onWalk}
                  onWalk={() => walk(FORGE_FRONT)}
                  onRod={() =>
                    void run({ kind: 'upgradeRod' }, `낚싯대를 ${tool.tier + 1}단계로 바꿨어요!`).then((ok) => {
                      if (ok) lifeSfx('anvil');
                    })
                  }
                  onPickup={() =>
                    void run({ kind: 'forgePickup' }, `${TOOL_INFO[g.forge!.tool].name}를 받았어요!`).then((ok) => {
                      if (ok) lifeSfx('fanfare');
                    })
                  }
                  onForge={() =>
                    void run({ kind: 'forge', tool: tool.id }, `${josa(TOOL_INFO[tool.id].name, '을/를')} 맡겼어요. 내일 아침 6시에 찾아가요.`).then((ok) => {
                      if (ok) lifeSfx('anvil');
                    })
                  }
                />
              )}
              <NodesStrip
                g={g}
                simple={simple || !onWalk}
                busy={busy}
                onWalk={(p) => walk(p)}
                onGather={(id, kind) =>
                  void run(
                    { kind: kind === 'rock' ? 'smash' : 'chop', node: id },
                    `${NODE_INFO[kind].name}${kind === 'rock' ? '를 깼어요.' : '를 베었어요.'}`,
                  ).then((ok) => {
                    if (ok) lifeSfx(kind === 'rock' ? 'smash' : 'chop');
                  })
                }
              />
              <p className="l-ledger-keys" aria-hidden="true">
                <kbd>1–3</kbd> 쪽 넘기기 <kbd>↑↓</kbd> 고르기 <kbd>Enter</kbd> {tab === 'skills' ? '전문가 고르기' : '대장간 가기'} <kbd>Esc</kbd> 덮기
              </p>
            </section>
          </>
        )}
      </div>
      {choose && (
        <ProfessionChooser
          skill={g.skills.find((s) => s.id === choose)!}
          busy={busy}
          onClose={() => setChoose(null)}
          onPick={async (prof) => {
            const ok = await run({ kind: 'chooseProf', skill: choose, prof }, `${SKILL_INFO[choose].name} 전문가 “${PROF_BY_ID[prof].name}”이 됐어요!`);
            if (ok) {
              lifeSfx('fanfare');
              setChoose(null);
            }
            return ok;
          }}
        />
      )}
      {respec && (
        <ConfirmModal
          title="망설임 석상에 빌까요?"
          body={
            <>
              {SKILL_INFO[respec].name} 전문가를 모두 내려놓고 다시 고를 수 있어요. <b>{formatBeom(RESPEC_PRICE)}</b>이 들어요. 지갑에{' '}
              {formatBeom(view.wallet.balance)}이 있어요.
            </>
          }
          confirmLabel="다시 고르기"
          busyLabel="비는 중…"
          cancelLabel="그대로 두기"
          onClose={() => setRespec(null)}
          onConfirm={() => run({ kind: 'respec', skill: respec }, `${SKILL_INFO[respec].name} 전문가를 다시 고를 수 있어요.`)}
        />
      )}
    </Modal>
  );
}

function SkillRow({ s, selected, onPick, onChoose }: { s: SkillView; selected: boolean; onPick: () => void; onChoose: () => void }) {
  const info = SKILL_INFO[s.id];
  const span = s.next === null ? 1 : s.next - s.from;
  const into = s.next === null ? 1 : Math.min(1, (s.xp - s.from) / span);
  return (
    <li>
      <button
        type="button"
        aria-current={selected || undefined}
        className="l-skill-row"
        style={{ ['--c' as string]: info.color }}
        onClick={onPick}
        onDoubleClick={() => s.choice && onChoose()}
        data-testid={`skill-${s.id}`}
      >
        <span className="l-skill-medal" aria-hidden="true">
          <Glyph name={SKILL_GLYPH[s.id]} size={26} />
        </span>
        <span className="l-skill-main">
          <span className="l-skill-name">
            <strong>{info.name}</strong>
            <span className="l-skill-lv" data-max={s.level === MAX_LEVEL || undefined}>
              Lv{s.level}
            </span>
            {s.prof.map((p) => (
              <span key={p} className="l-skill-prof">
                {PROF_BY_ID[p]?.name}
              </span>
            ))}
            {s.choice && (
              <span className="l-skill-pick" data-tip="Enter로 전문가 고르기">
                <Glyph name="spark" size={13} /> 고르기
              </span>
            )}
          </span>
          <span className="l-skill-notches" aria-label={`레벨 ${s.level} / ${MAX_LEVEL}`}>
            {Array.from({ length: MAX_LEVEL }, (_, k) => (
              <i key={k} data-on={k < s.level - 1 || s.level === MAX_LEVEL || undefined} data-now={k === s.level - 1 && s.level < MAX_LEVEL ? true : undefined} data-mark={k === 4 || k === 9 || undefined}>
                {k === s.level - 1 && s.level < MAX_LEVEL ? <b style={{ width: `${into * 100}%` }} /> : null}
              </i>
            ))}
          </span>
          <small className="l-skill-sub">
            {s.next === null ? '최고 레벨' : `${Math.floor(s.xp - s.from)} / ${span} XP`}
            <span className="l-skill-cap" data-tip={`하루 ${200} XP까지는 온전히, 그 뒤는 20%만 쌓여요`}>
              오늘 {Math.min(200, Math.round(s.today))}/200
            </span>
            {s.rest > 0 && (
              <span className="l-skill-rest" data-tip="쉬고 온 날마다 100씩 쌓여요 (최대 300). 남아 있는 동안 XP 두 배">
                <Glyph name="moon" size={12} /> 휴식 +{Math.round(s.rest)}
              </span>
            )}
            {s.behind && (
              <span className="l-skill-behind" data-tip={`마을 친구들 가운데 레벨(Lv${s.median})보다 낮으면 XP ×1.5`}>
                선배의 가르침 ×1.5
              </span>
            )}
          </small>
        </span>
      </button>
    </li>
  );
}

function SkillDetail({ g, s, onChoose, onRespec }: { g: GrowthView; s: SkillView; onChoose: () => void; onRespec: () => void }) {
  const info = SKILL_INFO[s.id];
  const five = profChoices(s.id);
  const mine5 = s.prof.find((p) => PROF_BY_ID[p]?.level === 5);
  const mine10 = s.prof.find((p) => PROF_BY_ID[p]?.level === 10);
  return (
    <article className="l-skill-card" style={{ ['--c' as string]: info.color }} data-testid="skill-detail">
      <header>
        <span className="l-skill-medal big" aria-hidden="true">
          <Glyph name={SKILL_GLYPH[s.id]} size={34} />
        </span>
        <div>
          <h3>
            {info.name} <span className="l-skill-lv">Lv{s.level}</span>
          </h3>
          <p>{info.note}</p>
        </div>
      </header>
      <ol className="l-perk-ladder" aria-label="레벨 보상">
        {LEVEL_PERKS[s.id].map((perk) => {
          const got = s.level >= perk.level;
          const prof = perk.level === 5 || perk.level === 10;
          return (
            <li key={perk.level} data-got={got || undefined} data-soon={perk.soon ? true : undefined} data-prof={prof || undefined}>
              <span className="l-perk-lv">{perk.level}</span>
              <span>
                {prof ? (
                  <>
                    {perk.text}
                    {perk.level === 5 && mine5 ? ` · ${PROF_BY_ID[mine5].name}` : ''}
                    {perk.level === 10 && mine10 ? ` · ${PROF_BY_ID[mine10].name}` : ''}
                  </>
                ) : (
                  perk.text
                )}
                {perk.soon ? <small> · {perk.soon} 이후</small> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="l-prof-tree" aria-label="전문가 갈래">
        {five.map((p) => {
          const chosen = s.prof.includes(p.id);
          return (
            <div key={p.id} className="l-prof-branch" data-chosen={chosen || undefined} data-dim={!!mine5 && !chosen ? true : undefined}>
              <span className="l-prof-node" data-tip={p.text}>
                <b>{p.name}</b>
                <small>{p.text}</small>
              </span>
              <span className="l-prof-kids">
                {profChoices(s.id, p.id).map((k) => (
                  <span key={k.id} className="l-prof-node small" data-chosen={s.prof.includes(k.id) || undefined} data-tip={k.text}>
                    <b>{k.name}</b>
                    <small>{k.text}</small>
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="l-ledger-row-actions">
        {s.choice ? (
          <button type="button" className="l-leaf" onClick={onChoose} data-testid="skill-choose">
            <Glyph name="spark" /> 전문가 고르기 <kbd>Enter</kbd>
          </button>
        ) : (
          <span className="l-ledger-aside">{s.level < 5 ? `Lv5가 되면 전문가를 골라요 · ${Math.max(0, Math.ceil(560 - s.xp))} XP 남음` : s.level < 10 && mine5 ? 'Lv10에 두 번째 전문가를 골라요' : ''}</span>
        )}
        {s.prof.length > 0 && (
          <button type="button" className="l-ink l-small" onClick={onRespec} data-testid="skill-respec" data-tip={`망설임 석상 · ${formatBeom(g.respecPrice)}`}>
            다시 고르기
          </button>
        )}
      </div>
    </article>
  );
}

function TierPips({ tier, id }: { tier: number; id?: string }) {
  return (
    <span className="l-tier-pips" aria-label={`${tier}단계`} data-testid={id}>
      {([1, 2, 3, 4, 5] as ToolTier[]).map((k) => (
        <i key={k} data-tier={k} data-on={k <= tier || undefined} data-tip={`${k}단계 ${TIER_NAME[k]}`} />
      ))}
    </span>
  );
}

function ToolRow({ t, selected, forging, onPick }: { t: ToolView; selected: boolean; forging: GrowthView['forge']; onPick: () => void }) {
  const info = TOOL_INFO[t.id];
  return (
    <li>
      <button type="button" aria-current={selected || undefined} className="l-tool-row" data-tier={t.tier} onClick={onPick} data-testid={`tool-${t.id}`}>
        <span className="l-tool-peg" aria-hidden="true">
          <Glyph name={TOOL_GLYPH[t.id]} size={30} />
        </span>
        <span className="l-tool-main">
          <strong>
            {TIER_NAME[t.tier as ToolTier]} {info.name}
          </strong>
          <small>{info.tiers[t.tier as ToolTier]}</small>
        </span>
        <TierPips tier={t.tier} />
        {forging && <span className="l-tool-away">{forging.ready ? '찾을 수 있어요' : '대장간에 맡김'}</span>}
      </button>
    </li>
  );
}

function ToolDetail({
  g,
  t,
  now,
  inv,
  busy,
  balance,
  simple,
  onWalk,
  onForge,
  onPickup,
  onRod,
}: {
  g: GrowthView;
  t: ToolView;
  now: number;
  inv: Record<string, number>;
  busy: boolean;
  balance: number;
  simple: boolean;
  onWalk: () => void;
  onForge: () => void;
  onPickup: () => void;
  onRod: () => void;
}) {
  const info = TOOL_INFO[t.id];
  const next = t.next;
  const forging = g.forge?.tool === t.id ? g.forge : null;
  return (
    <article className="l-tool-card" data-testid="tool-detail">
      <header>
        <span className="l-tool-peg big" aria-hidden="true">
          <Glyph name={TOOL_GLYPH[t.id]} size={40} />
        </span>
        <div>
          <h3>
            {TIER_NAME[t.tier as ToolTier]} {info.name}
          </h3>
          <TierPips tier={t.tier} id={`tool-pips-${t.id}`} />
          <p>지금: {info.tiers[t.tier as ToolTier]}</p>
        </div>
      </header>
      {forging ? (
        <p className="l-tool-forging" data-ready={forging.ready || undefined}>
          <Glyph name="anvil" size={18} />{' '}
          {forging.ready
            ? `${TIER_NAME[forging.to as ToolTier]} ${info.name}가 다 됐대요!`
            : `${TIER_NAME[forging.to as ToolTier]} ${info.name}로 두드리는 중 · ${untilText(forging.readyAt - now)} 뒤 아침 6시. 그동안은 지금 도구로 일해요.`}
        </p>
      ) : null}
      {next ? (
        <div className="l-tool-next">
          <h4>
            다음 · {next.to}단계 {TIER_NAME[next.to as ToolTier]}
          </h4>
          <p>{info.tiers[next.to as ToolTier]}</p>
          {next.shop ? (
            <p className="l-ledger-aside">낚싯대 2·3단계는 낚시 도구함에서 바로 바꿔요 · {formatBeom(ROD_PRICE[next.to as 2 | 3])}</p>
          ) : next.mats ? (
            <ul className="l-tool-cost">
              <li data-short={balance < (next.beom ?? 0) || undefined}>
                <Glyph name="sack" size={20} /> {formatBeom(next.beom ?? 0)}
                {next.senior ? <em className="l-tool-senior">선배 할인 반값</em> : null}
              </li>
              {Object.entries(next.mats).map(([id, n]) => (
                <li key={id} data-short={(inv[id] ?? 0) < n || undefined}>
                  <ItemIcon id={id} size={22} /> {ITEM_BY_ID[id]?.name ?? id} {Math.min(inv[id] ?? 0, n)}/{n}
                </li>
              ))}
            </ul>
          ) : null}
          {next.why && !next.shop ? <p className="l-why">{next.why}</p> : null}
        </div>
      ) : (
        <p className="l-ledger-aside">가장 좋은 도구예요. 별빛이 반짝여요.</p>
      )}
      <div className="l-ledger-row-actions">
        {forging?.ready ? (
          simple ? (
            <button type="button" className="l-leaf" disabled={busy} onClick={onPickup} data-testid="tool-pickup">
              <Glyph name="anvil" /> 도구 찾기
            </button>
          ) : (
            <button type="button" className="l-leaf" onClick={onWalk} data-testid="tool-walk">
              <Glyph name="walk" /> 대장간으로 찾으러 가기 <kbd>Enter</kbd>
            </button>
          )
        ) : next?.shop ? (
          <button type="button" className="l-leaf" disabled={busy || balance < ROD_PRICE[next.to as 2 | 3]} onClick={onRod} data-testid="tool-rod">
            <Glyph name="rod" /> 낚싯대 바꾸기
          </button>
        ) : !g.forgeOpen ? (
          <span className="l-ledger-aside">대장간은 마을 개척 “대장간 재건”이 끝나면 열려요.</span>
        ) : simple ? (
          <button type="button" className="l-leaf" disabled={busy || !!g.forge || !next || !!next.why} onClick={onForge} data-testid="tool-forge">
            <Glyph name="anvil" /> 대장간에 맡기기
          </button>
        ) : (
          <button type="button" className="l-ink" onClick={onWalk} data-testid="tool-walk">
            <Glyph name="walk" /> 대장간 가기 <kbd>Enter</kbd>
          </button>
        )}
      </div>
    </article>
  );
}

function NodesStrip({
  g,
  simple,
  busy,
  onWalk,
  onGather,
}: {
  g: GrowthView;
  simple: boolean;
  busy: boolean;
  onWalk: (p: VillagePoint) => void;
  onGather: (id: string, kind: NodeKind) => void;
}) {
  if (!g.nodes.length) return null;
  return (
    <section className="l-growth-nodes" aria-label="오늘의 재료">
      <h4>
        <Glyph name="axe" size={16} /> 오늘의 재료 <small>마을 가장자리 · 매일 새로 자라요 · 바위에서는 가끔 구리</small>
      </h4>
      <ul>
        {g.nodes.map((n) => (
          <li key={n.id} data-taken={n.taken || undefined}>
            <Glyph name={NODE_GLYPH[n.kind]} size={20} />
            <span>{NODE_INFO[n.kind].name}</span>
            {n.taken ? (
              <small>오늘 거뒀어요</small>
            ) : simple ? (
              <button type="button" className="l-ink l-small" disabled={busy} onClick={() => onGather(n.id, n.kind)} data-testid={`node-${n.id}`}>
                {NODE_INFO[n.kind].verb}
              </button>
            ) : (
              <button type="button" className="l-ink l-small" onClick={() => onWalk(nodeFront(n))} data-testid={`node-${n.id}`}>
                <Glyph name="walk" size={14} /> 가 보기
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The Lv5 / Lv10 pick: two cards side by side, ←/→ + Enter, then a confirm step. */
export function ProfessionChooser({
  skill,
  busy,
  onClose,
  onPick,
}: {
  skill: SkillView;
  busy: boolean;
  onClose: () => void;
  onPick: (prof: string) => Promise<boolean>;
}) {
  const options = skill.choice ?? [];
  const [at, setAt] = useState(0);
  const [sure, setSure] = useState(false);
  const info = SKILL_INFO[skill.id];
  const level = options.length ? PROF_BY_ID[options[0]].level : 5;
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setAt((i) => (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length);
      setSure(false);
    } else if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button')) {
      if (sure) void onPick(options[at]);
      else setSure(true);
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };
  if (!options.length) return null;
  const chosen = PROF_BY_ID[options[at]];
  return (
    <Modal title={`${info.name} Lv${level} · 전문가 고르기`} onClose={onClose} className="l-prof-modal" wide>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- ←/→ pick a card, Enter twice confirms. */}
      <div className="l-prof-pick" onKeyDown={onKey} tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })} data-testid="prof-chooser">
        <p className="l-modal-intro">
          둘 중 하나를 골라요. {level === 5 ? 'Lv10에서는 고른 쪽 아래 두 갈래 중 하나를 또 골라요.' : '마지막 선택이에요.'} 나중에 바꾸려면 망설임
          석상에서 {formatBeom(RESPEC_PRICE)}이 들어요.
        </p>
        <div className="l-prof-cards" role="radiogroup" aria-label="전문가">
          {options.map((id, i) => {
            const p = PROF_BY_ID[id];
            const kids = level === 5 ? profChoices(skill.id, id) : [];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={at === i}
                className="l-prof-card"
                style={{ ['--c' as string]: info.color }}
                onClick={() => {
                  setAt(i);
                  setSure(false);
                }}
                data-testid={`prof-${id}`}
              >
                <span className="l-prof-crest" aria-hidden="true">
                  <Glyph name={SKILL_GLYPH[skill.id]} size={40} />
                </span>
                <strong>{p.name}</strong>
                <span className="l-prof-effect">{p.text}</span>
                {kids.length > 0 && (
                  <span className="l-prof-then">
                    Lv10에서: {kids.map((k) => k.name).join(' 또는 ')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="l-modal-actions">
          <button type="button" className="l-secondary" onClick={onClose}>
            다음에
          </button>
          <button
            type="button"
            className="l-primary"
            disabled={busy}
            onClick={() => (sure ? void onPick(chosen.id) : setSure(true))}
            data-testid="prof-confirm"
          >
            {sure ? `정말 “${chosen.name}”으로 할게요` : `“${chosen.name}” 고르기`}
          </button>
        </div>
        <p className="l-ledger-keys" aria-hidden="true">
          <kbd>←→</kbd> 고르기 <kbd>Enter</kbd> 한 번 더 누르면 확정 <kbd>Esc</kbd> 다음에
        </p>
      </div>
    </Modal>
  );
}
