'use client';
// 기술 트리 (handover/design/design-skill-tree.md §3): one small tree per skill
// drawn like the 마을 개척 chart — level runs left to right, the 기본기 spine
// on top, the shared 재능 under it and the two Lv5 갈래 at the bottom with
// their 재능 and Lv10 picks. Arrow keys move between nodes, Enter acts, Q/E
// switch skills. Used by the 성장 수첩 (my trees) and the 친구 창 (read-only).
import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  LEVEL_PERKS,
  MAX_LEVEL,
  PROFESSIONS,
  PROF_BY_ID,
  SKILLS,
  SKILL_INFO,
  type LevelPerk,
  type ProfDef,
  type SkillId,
} from '../lounge-growth-data';
import { TALENT_BY_ID, talentPoints, talentsOf, type TalentDef } from '../lounge-growth-talents';
import { Glyph } from './field-glyphs';
import { SKILL_GLYPH, profGlyph } from './growth-glyphs';
import './skill-tree.css';

/** What a tree shows: mine (with points and picks waiting) or a friend's. */
export type TreeSkill = {
  id: SkillId;
  level: number;
  prof: string[];
  tal: string[];
  /** Free talent points (mine only). */
  left?: number;
  /** Profession picks waiting (mine only). */
  choice?: string[] | null;
  /** XP, today's cap, rest (mine only). */
  progress?: string;
};
type NodeState = 'got' | 'open' | 'locked' | 'lock' | 'dim' | 'idle';
type TreeNode = {
  key: string;
  kind: 'perk' | 'prof' | 'talent';
  level: number;
  row: number;
  name: string;
  text: string;
  state: NodeState;
  why: string;
  from: string[];
  perk?: LevelPerk;
  prof?: ProfDef;
  talent?: TalentDef;
};

const COL_W = 84,
  ROW_H = 44,
  PAD_X = 46,
  /** Room on the right for the Lv10 names. */
  PAD_END = 74,
  PAD_Y = 30;
const ROWS = 5.3;
const WIDTH = PAD_X + PAD_END + COL_W * (MAX_LEVEL - 1),
  HEIGHT = PAD_Y * 2 + ROW_H * ROWS;
const xOf = (level: number) => PAD_X + (level - 1) * COL_W;
const yOf = (row: number) => PAD_Y + row * ROW_H;
/** Rows: the 기본기 spine, two shared rows, then 갈래 A and B (their Lv10 picks fan out). */
const BRANCH_ROW = [3.25, 4.75];
const KID_SPREAD = 0.4;

const STATE_WORD: Record<NodeState, string> = {
  got: '익혔어요',
  open: '찍을 수 있어요',
  locked: '아직 잠겨 있어요',
  lock: '준비 중',
  dim: '다른 갈래',
  idle: '',
};

/** Builds the nodes of one skill's tree with their states for `s`. */
export function treeNodes(s: TreeSkill, readOnly = false): TreeNode[] {
  const out: TreeNode[] = [];
  const mine5 = s.prof.find((p) => PROF_BY_ID[p]?.level === 5);
  const mine10 = s.prof.find((p) => PROF_BY_ID[p]?.level === 10);
  const points = talentPoints(s.level);
  const left = s.left ?? Math.max(0, points - s.tal.length);
  // 기본기 spine (Lv5 / Lv10 are the profession picks below).
  let prevPerk = '';
  for (const perk of LEVEL_PERKS[s.id]) {
    if (perk.level === 5 || perk.level === MAX_LEVEL) continue;
    const key = `perk-${perk.level}`;
    out.push({
      key,
      kind: 'perk',
      level: perk.level,
      row: 0,
      name: `Lv${perk.level} 기본기`,
      text: perk.text,
      state: perk.soon ? 'lock' : s.level >= perk.level ? 'got' : 'locked',
      why: perk.soon ? `${perk.soon}에서 열려요` : s.level >= perk.level ? '' : `Lv${perk.level}에 자동으로 받아요`,
      from: prevPerk ? [prevPerk] : [],
      perk,
    });
    prevPerk = key;
  }
  // 재능: shared rows by their Lv2 head, branch talents on their 갈래's row.
  const heads = talentsOf(s.id).filter((t) => !t.branch && !t.after);
  const branchOf = (prof: string) => profsOf(s.id).five.findIndex((p) => p.id === prof);
  const talentState = (t: TalentDef): [NodeState, string] => {
    if (s.tal.includes(t.id)) return ['got', ''];
    if (t.lock) return ['lock', t.lock];
    if (t.branch && mine5 && mine5 !== t.branch) return ['dim', `${PROF_BY_ID[t.branch].name} 갈래의 재능이에요`];
    if (s.level < t.level) return ['locked', `Lv${t.level}부터 찍을 수 있어요`];
    if (t.branch && !s.prof.includes(t.branch)) return ['locked', `Lv5에 “${PROF_BY_ID[t.branch].name}”을 고르면 열려요`];
    if (t.after && !s.tal.includes(t.after) && !TALENT_BY_ID[t.after]?.lock) return ['locked', `먼저 “${TALENT_BY_ID[t.after].name}”을 익혀요`];
    if (left <= 0) return ['locked', '남은 재능 점수가 없어요'];
    return [readOnly ? 'idle' : 'open', ''];
  };
  for (const t of talentsOf(s.id)) {
    const head = t.after ? TALENT_BY_ID[t.after] : t;
    const row = t.branch ? BRANCH_ROW[branchOf(t.branch)] : 1 + Math.max(0, heads.findIndex((h) => h.id === (head.after ?? head.id)));
    const [state, why] = talentState(t);
    out.push({
      key: t.id,
      kind: 'talent',
      level: t.level,
      row,
      name: t.name,
      text: t.text,
      state,
      why,
      from: t.after ? [t.after] : t.branch ? [t.branch] : ['perk-2'],
      talent: t,
    });
  }
  // 직업: Lv5 pair from the spine, Lv10 picks under each.
  const { five } = profsOf(s.id);
  five.forEach((p, i) => {
    const profState = (d: ProfDef): [NodeState, string] => {
      if (s.prof.includes(d.id)) return ['got', ''];
      if (d.lock) return ['lock', d.lock];
      if (d.level === 5 && mine5) return ['dim', '다른 갈래를 골랐어요'];
      if (d.level === 10 && (mine10 || (mine5 && mine5 !== d.parent))) return ['dim', mine10 ? '다른 전문가를 골랐어요' : '다른 갈래예요'];
      if (s.level < d.level) return ['locked', `Lv${d.level}에 둘 중 하나를 골라요`];
      if (d.level === 10 && !s.prof.includes(d.parent!)) return ['locked', `Lv5에 “${PROF_BY_ID[d.parent!].name}”을 골라야 해요`];
      return [readOnly ? 'idle' : 'open', ''];
    };
    const [state, why] = profState(p);
    out.push({ key: p.id, kind: 'prof', level: 5, row: BRANCH_ROW[i], name: p.name, text: p.text, state, why, from: ['perk-4'], prof: p });
    profsOf(s.id)
      .ten.filter((k) => k.parent === p.id)
      .forEach((k, j) => {
        const lastTalent = talentsOf(s.id).filter((t) => t.branch === p.id).at(-1);
        const [ks, kw] = profState(k);
        out.push({
          key: k.id,
          kind: 'prof',
          level: 10,
          row: BRANCH_ROW[i] + (j ? KID_SPREAD : -KID_SPREAD),
          name: k.name,
          text: k.text,
          state: ks,
          why: kw,
          from: [lastTalent?.id ?? p.id],
          prof: k,
        });
      });
  });
  return out;
}
/** Whether any talent of the tree can be taken now (points left and a node open). */
export const canPickTalent = (s: TreeSkill) => treeNodes(s).some((n) => n.kind === 'talent' && n.state === 'open');
function profsOf(skill: SkillId) {
  const all = PROFESSIONS.filter((p) => p.skill === skill);
  return { five: all.filter((p) => p.level === 5), ten: all.filter((p) => p.level === 10) };
}
/** The nearest node from `at` in a direction (arrow keys). */
function step(nodes: TreeNode[], at: TreeNode, dx: number, dy: number): TreeNode {
  let best: TreeNode | null = null,
    bestScore = Infinity;
  for (const n of nodes) {
    if (n === at) continue;
    const ddx = xOf(n.level) - xOf(at.level),
      ddy = yOf(n.row) - yOf(at.row);
    const along = dx ? ddx * dx : ddy * dy;
    if (along <= 0) continue;
    const across = dx ? Math.abs(ddy) : Math.abs(ddx);
    const score = along + across * 2.2;
    if (score < bestScore) {
      best = n;
      bestScore = score;
    }
  }
  return best ?? at;
}

export function SkillTreeBoard({
  skills,
  initial,
  readOnly = false,
  owner,
  busy = false,
  onPickTalent,
  onChooseProf,
}: {
  skills: TreeSkill[];
  initial?: SkillId;
  readOnly?: boolean;
  /** Whose trees (the friend's name, read-only view). */
  owner?: string;
  busy?: boolean;
  onPickTalent?: (skill: SkillId, talent: string) => Promise<boolean>;
  onChooseProf?: (skill: SkillId) => void;
}) {
  const [skillId, setSkillId] = useState<SkillId>(initial ?? skills[0]?.id ?? 'farm');
  const s = skills.find((k) => k.id === skillId) ?? skills[0];
  const nodes = useMemo(() => (s ? treeNodes(s, readOnly) : []), [s, readOnly]);
  const firstKey = () => nodes.find((n) => n.state === 'open')?.key ?? nodes.find((n) => n.kind === 'talent')?.key ?? nodes[0]?.key;
  const [pickedKey, setPickedKey] = useState<string | undefined>(undefined);
  const [sure, setSure] = useState(false);
  if (!s) return null;
  const picked = nodes.find((n) => n.key === pickedKey) ?? nodes.find((n) => n.key === firstKey())!;
  const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const info = SKILL_INFO[s.id];
  const points = talentPoints(s.level);
  const left = s.left ?? Math.max(0, points - s.tal.length);
  const pick = (key: string) => {
    setPickedKey(key);
    setSure(false);
  };
  const switchSkill = (d: number) => {
    const i = SKILLS.indexOf(s.id);
    setSkillId(SKILLS[(i + d + SKILLS.length) % SKILLS.length]);
    setPickedKey(undefined);
    setSure(false);
  };
  const act = () => {
    if (readOnly || busy || picked.state !== 'open') return;
    if (picked.kind === 'prof') onChooseProf?.(s.id);
    else if (picked.kind === 'talent') {
      if (!sure) return setSure(true);
      void onPickTalent?.(s.id, picked.key).then((ok) => ok && setSure(false));
    }
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'BUTTON' && t.closest('.l-tree-card') && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key === 'ArrowRight') pick(step(nodes, picked, 1, 0).key);
    else if (e.key === 'ArrowLeft') pick(step(nodes, picked, -1, 0).key);
    else if (e.key === 'ArrowDown') pick(step(nodes, picked, 0, 1).key);
    else if (e.key === 'ArrowUp') pick(step(nodes, picked, 0, -1).key);
    else if (e.key === 'q' || e.key === 'Q') switchSkill(-1);
    else if (e.key === 'e' || e.key === 'E') switchSkill(1);
    else if (e.key === 'Enter' || e.key === ' ') act();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };
  const where = picked.talent?.branch
    ? `${PROF_BY_ID[picked.talent.branch].name} 갈래`
    : picked.kind === 'talent'
      ? '공통'
      : picked.kind === 'prof'
        ? picked.prof!.level === 5
          ? '전문가 ①'
          : `전문가 ② · ${PROF_BY_ID[picked.prof!.parent!].name} 갈래`
        : '기본기 · 자동';
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Arrow keys move between nodes, Q/E switch skills; every control is a button.
    <div className="l-tree" onKeyDown={onKey} data-testid={readOnly ? 'friend-tree' : 'skill-tree'} style={{ ['--c' as string]: info.color }}>
      <div className="l-tree-tabs" role="tablist" aria-label={owner ? `${owner}의 기술` : '기술 (Q/E로 넘기기)'}>
        {skills.map((k) => {
          const waiting = !readOnly && (canPickTalent(k) || !!k.choice?.some((p) => !PROF_BY_ID[p]?.lock));
          return (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={k.id === s.id}
              className="l-tree-tab"
              style={{ ['--c' as string]: SKILL_INFO[k.id].color }}
              onClick={() => {
                setSkillId(k.id);
                setPickedKey(undefined);
                setSure(false);
              }}
              data-testid={`tree-tab-${k.id}`}
            >
              <Glyph name={SKILL_GLYPH[k.id]} size={16} /> {SKILL_INFO[k.id].name} <small>Lv{k.level}</small>
              {waiting && <i className="l-tree-dot" aria-label="고를 것이 있어요" />}
            </button>
          );
        })}
      </div>
      <p className="l-tree-head" data-testid="tree-points">
        <strong>
          {owner ? `${owner}의 ` : ''}
          {info.name} Lv{s.level}
        </strong>
        <span>
          {readOnly ? `재능 ${s.tal.length} / ${points}` : `남은 재능 점수 ${left} / ${points}`}
          <small> · 2·4·6·8·10레벨에 1점 (최대 5점)</small>
        </span>
        {s.progress && <small className="l-tree-progress">{s.progress}</small>}
      </p>
      <div className="l-tree-chart" role="listbox" aria-label={`${info.name} 기술 트리 (방향키로 고르기)`}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="l-tree-lines" aria-hidden="true">
          <path d={`M${xOf(1)} ${yOf(0)} L${xOf(2)} ${yOf(0)}`} className={s.level >= 2 ? 'l-tree-road' : 'l-tree-trail'} />
          {nodes.flatMap((n) =>
            n.from.map((f) => {
              const p = byKey[f];
              if (!p) return null;
              const a = { x: xOf(p.level), y: yOf(p.row) },
                b = { x: xOf(n.level), y: yOf(n.row) };
              const lit = p.state === 'got' && n.state === 'got';
              const mid = (a.x + b.x) / 2;
              return (
                <path
                  key={f + n.key}
                  d={a.y === b.y ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`}
                  className={lit ? 'l-tree-road' : n.state === 'dim' ? 'l-tree-faint' : 'l-tree-trail'}
                />
              );
            }),
          )}
          <circle cx={xOf(1)} cy={yOf(0)} r={7} className="l-tree-start" />
        </svg>
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <span key={i} className="l-tree-lv" style={{ left: `${(xOf(i + 1) / WIDTH) * 100}%` }} aria-hidden="true">
            Lv{i + 1}
          </span>
        ))}
        {nodes.map((n) => (
          <button
            key={n.key}
            type="button"
            role="option"
            aria-selected={picked.key === n.key}
            className="l-tree-node"
            data-kind={n.kind}
            data-state={n.state}
            style={{ left: `${(xOf(n.level) / WIDTH) * 100}%`, top: `${(yOf(n.row) / HEIGHT) * 100}%` }}
            onClick={() => pick(n.key)}
            onDoubleClick={() => {
              pick(n.key);
              if (n.state === 'open' && n.kind === 'prof') onChooseProf?.(s.id);
            }}
            data-testid={`tree-${n.key}`}
            data-tip={`${n.name}${n.state !== 'idle' ? ` · ${STATE_WORD[n.state]}` : ''}`}
          >
            {n.kind === 'perk' ? (
              <span className="l-tree-pip" aria-hidden="true">
                {n.state === 'lock' ? <Glyph name="lock" size={11} /> : null}
              </span>
            ) : (
              <>
                <span className="l-tree-icon" aria-hidden="true">
                  {n.state === 'lock' ? (
                    <Glyph name="lock" size={13} />
                  ) : n.kind === 'prof' ? (
                    <Glyph name={profGlyph(n.key) ?? SKILL_GLYPH[s.id]} size={14} />
                  ) : n.state === 'got' ? (
                    <Glyph name="check" size={13} />
                  ) : (
                    <Glyph name="spark" size={13} />
                  )}
                </span>
                <b>{n.name}</b>
              </>
            )}
          </button>
        ))}
      </div>
      <section className="l-tree-card" data-state={picked.state} aria-live="polite" data-testid="tree-detail">
        <header>
          <span className="l-tree-where">{where}</span>
          <h3>{picked.kind === 'perk' ? picked.text : picked.name}</h3>
          {picked.state !== 'idle' && (
            <span className="l-tree-stamp" data-state={picked.state}>
              {STATE_WORD[picked.state]}
            </span>
          )}
        </header>
        {picked.kind !== 'perk' && <p className="l-tree-effect">{picked.text}</p>}
        <p className="l-tree-req">
          {picked.kind === 'perk' ? `Lv${picked.level}에 자동으로 받아요` : `필요: Lv${picked.level}`}
          {picked.talent?.after ? ` · 먼저: ${TALENT_BY_ID[picked.talent.after].name}` : ''}
          {picked.talent?.branch ? ` · 갈래: ${PROF_BY_ID[picked.talent.branch].name}` : ''}
          {picked.kind === 'talent' ? ' · 재능 점수 1' : ''}
        </p>
        {picked.why && <p className="l-tree-why">{picked.state === 'lock' ? <Glyph name="lock" size={13} /> : null} {picked.why}</p>}
        {!readOnly && picked.state === 'open' && (
          <div className="l-ledger-row-actions">
            {picked.kind === 'prof' ? (
              <button type="button" className="l-leaf" disabled={busy} onClick={() => onChooseProf?.(s.id)} data-testid="tree-choose">
                <Glyph name="spark" /> 전문가 고르기 <kbd>Enter</kbd>
              </button>
            ) : (
              <button type="button" className="l-leaf" disabled={busy} onClick={act} data-testid="tree-pick">
                <Glyph name="spark" /> {sure ? `정말 “${picked.name}”을 찍을게요` : '찍기'} <kbd>Enter</kbd>
              </button>
            )}
          </div>
        )}
        {!readOnly && picked.kind === 'talent' && picked.state === 'got' && (
          <p className="l-tree-why">다시 고르려면 산기슭 마을 점집의 신이치에게 “운명 다시 보기”를 부탁해요.</p>
        )}
      </section>
    </div>
  );
}
