'use client';
// 마을 게시판: the eight village bundles everyone fills together (items or 범),
// who helped, and what each one restores in the village; 마을 공사 2차 (big
// shared 범 projects) and this week's 마을 축제 기금 (ECON-2).
import { useState } from 'react';
import { Check, ClipboardList, Coins, Compass, Construction, Hammer, Lock, PartyPopper, Users } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  BUNDLES,
  BUNDLE_REWARD_BEOM,
  FESTIVAL_SOUVENIR_MIN,
  FURNITURE_BY_REF,
  PROJECTS,
  PROJECT_MIN_GIVE,
  VILLAGE_FLAGS,
} from '../lounge-items';
import { FURNITURE_ART } from '../lounge-furniture-art';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { needHave, needLabel } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { useLifeAction } from './LifePanels';
import { ResearchBoard } from './GrowthResearch';
import './life-plus.css';

const BEOM_STEPS = [1_000, 10_000, 50_000];
/** 마을 공사 / 축제 기금 give steps. */
const GIVE_STEPS = [10_000, 50_000, 100_000];
type BoardTab = 'bundles' | 'projects' | 'festival' | 'research';
const stepLabel = (v: number) => (v >= 10_000 ? `${v / 10_000}만` : `${v / 1_000}천`);
const flagName = (flag: string) => VILLAGE_FLAGS[flag]?.split(' · ')[0] ?? flag;
const byAmount = (by: Record<string, number>) =>
  Object.entries(by)
    .sort(([, a], [, b]) => b - a)
    .map(([actor, n]) => `${ACTORS[Number(actor)] ?? '친구'} ${formatBeom(n)}`)
    .join(' · ');

export function BundleBoard(props: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
}) {
  const life = props.view.life;
  const [tab, setTab] = useState<BoardTab>(() =>
    life && (life.bundles ?? []).every((b) => b.done) && life.projects ? 'projects' : 'bundles',
  );
  if (!life)
    return (
      <Modal title="마을 게시판" onClose={props.onClose}>
        <p className="l-help-text">마을에 연결되면 게시판을 볼 수 있어요.</p>
      </Modal>
    );
  return (
    <Modal title="마을 게시판" onClose={props.onClose} className="l-life-modal l-board" wide>
      <div className="l-mail-tabs" role="tablist" aria-label="게시판">
        <button role="tab" aria-selected={tab === 'bundles'} onClick={() => setTab('bundles')} data-testid="board-tab-bundles">
          <ClipboardList size={15} /> 꾸러미
        </button>
        <button role="tab" aria-selected={tab === 'projects'} onClick={() => setTab('projects')} data-testid="board-tab-projects">
          <Construction size={15} /> 마을 공사
        </button>
        <button role="tab" aria-selected={tab === 'festival'} onClick={() => setTab('festival')} data-testid="board-tab-festival">
          <PartyPopper size={15} /> 축제 기금
        </button>
        <button role="tab" aria-selected={tab === 'research'} onClick={() => setTab('research')} data-testid="board-tab-research">
          <Compass size={15} /> 마을 개척
        </button>
      </div>
      {tab === 'bundles' ? (
        <BundlePanel {...props} />
      ) : tab === 'projects' ? (
        <ProjectPanel {...props} />
      ) : tab === 'festival' ? (
        <FestivalPanel {...props} />
      ) : (
        <ResearchBoard room={props.room} view={props.view} notify={props.notify} />
      )}
    </Modal>
  );
}

function GiveSteps({
  left,
  value,
  onPick,
  label,
  base = GIVE_STEPS,
}: {
  left: number;
  value: number;
  onPick: (v: number) => void;
  label: string;
  base?: readonly number[];
}) {
  const steps = [...base.filter((v) => v < left), left].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <span className="l-beom-steps" role="group" aria-label={label}>
      {steps.map((v) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onPick(v)}>
          {v === left && !base.includes(v) ? `남은 ${formatBeom(v)}` : stepLabel(v)}
        </button>
      ))}
    </span>
  );
}

/** 마을 공사 2차: big shared 범 projects with a world change when finished. */
function ProjectPanel({ room, view, notify }: { room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const life = view.life!;
  const list = life.projects;
  const [picked, setPicked] = useState(() => Math.max(0, (list ?? []).findIndex((p) => p.open && !p.done)));
  const [give, setGive] = useState(10_000);
  const [run, busy] = useLifeAction(room, notify);
  if (!list)
    return <p className="l-help-text">서버가 업데이트되면 마을 공사를 시작할 수 있어요. 잠시 뒤 다시 열어 주세요.</p>;
  const def = PROJECTS[picked],
    state = list[picked];
  const left = Math.max(0, def.cost - state.got);
  const amount = Math.max(Math.min(PROJECT_MIN_GIVE, left), Math.min(give, left));
  const balance = view.wallet.balance;
  const doneCount = list.filter((p) => p.done).length;
  return (
    <>
      <p className="l-modal-intro">
        <Construction size={15} aria-hidden="true" /> 모두의 범을 모아 마을을 크게 고쳐요. 끝나면 마을이 바뀌고, 보탠 친구 모두 “마을 공사 현판”을 받아요.{' '}
        <b data-testid="projects-done">
          {doneCount}/{PROJECTS.length}
        </b>{' '}
        완공
      </p>
      <div className="l-board-body">
        <ul className="l-bundle-list" aria-label="마을 공사">
          {PROJECTS.map((p, i) => {
            const st = list[i];
            const pct = Math.min(100, Math.floor((st.got / p.cost) * 100));
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={picked === i}
                  data-done={st.done || undefined}
                  onClick={() => setPicked(i)}
                  data-testid={`project-${p.id}`}
                >
                  <span className="l-bundle-pin" aria-hidden="true">
                    {st.done ? <Check size={16} /> : st.open ? <Hammer size={14} /> : <Lock size={14} />}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {st.done ? `완공 · ${flagName(p.flag)}` : st.open ? `${pct}% · ${formatBeom(p.cost)}` : `잠김 · ${flagName(p.requires!)} 복원 뒤`}
                    </small>
                    <progress max={100} value={pct} aria-label={`${p.name} 진행`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <section className="l-bundle-detail" aria-live="polite" data-testid="project-detail">
          <h3>
            {def.name} <small>{VILLAGE_FLAGS[def.flag]}</small>
          </h3>
          <p className="l-help-text">{def.note}</p>
          {state.done ? (
            <p className="l-bundle-done">
              <Check size={16} aria-hidden="true" /> 완공! {josa(flagName(def.flag), '이/가')} 마을에 생겼어요.
            </p>
          ) : !state.open ? (
            <p className="l-bundle-done" data-testid="project-locked">
              <Lock size={16} aria-hidden="true" /> 마을 복원 {josa(flagName(def.requires!), '을/를')} 먼저 마치면 시작할 수 있어요.
            </p>
          ) : null}
          <ul className="l-bundle-slots">
            <li data-full={!left || undefined}>
              <Coins size={30} className="l-bundle-coin" aria-hidden="true" />
              <span className="l-slot-text">
                <strong>공사비</strong>
                <progress max={def.cost} value={state.got} aria-label={`${def.name} 모은 범`} />
                <small data-testid="project-progress">
                  {formatBeom(state.got)} / {formatBeom(def.cost)}
                  {left ? ` · 남은 ${formatBeom(left)}` : ' · 다 모았어요'}
                  {state.by[String(life.actors[view.self])] ? ` · 내가 보탠 ${formatBeom(state.by[String(life.actors[view.self])])}` : ''}
                </small>
              </span>
              {state.open && !state.done && left > 0 && (
                <span className="l-slot-give">
                  <GiveSteps left={left} value={amount} onPick={setGive} label="보탤 범" />
                  <button
                    type="button"
                    className="l-primary"
                    disabled={busy || balance < amount}
                    onClick={() =>
                      void run({ kind: 'project', project: def.id, n: amount }, `${def.name}에 ${formatBeom(amount)}을 보탰어요.`).then((ok) => {
                        if (ok) lifeSfx('donate');
                      })
                    }
                    data-testid="project-give"
                  >
                    보태기
                  </button>
                  {balance < amount && <small className="l-why">범이 모자라요</small>}
                </span>
              )}
            </li>
          </ul>
          <p className="l-bundle-helpers" data-testid="project-helpers">
            <Users size={14} aria-hidden="true" />{' '}
            {Object.keys(state.by).length ? byAmount(state.by) : `아직 아무도 보태지 않았어요. ${josa('첫 번째 손길', '이/가')} 되어 주세요.`}
          </p>
        </section>
      </div>
    </>
  );
}

/** 주간 마을 축제 기금: a weekly shared goal with a souvenir for helpers. */
function FestivalPanel({ room, view, notify }: { room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const life = view.life!;
  const fest = life.festival;
  const [give, setGive] = useState(FESTIVAL_SOUVENIR_MIN);
  const [run, busy] = useLifeAction(room, notify);
  if (!fest) return <p className="l-help-text">서버가 업데이트되면 마을 축제 기금을 모을 수 있어요.</p>;
  const left = Math.max(0, fest.goal - fest.got);
  const amount = Math.max(Math.min(PROJECT_MIN_GIVE, left), Math.min(give, left));
  const mine = fest.by[String(life.actors[view.self])] ?? 0;
  const souvenir = FURNITURE_BY_REF[fest.souvenir];
  const days = Math.max(1, Math.ceil((fest.resetAt - life.serverNow) / 86_400_000));
  return (
    <section className="l-bundle-detail l-festival" aria-live="polite" data-testid="festival-panel">
      <p className="l-modal-intro">
        <PartyPopper size={15} aria-hidden="true" /> 매주 월요일에 새로 모아요. 이번 주 목표를 채우면 {formatBeom(FESTIVAL_SOUVENIR_MIN)} 이상 보탠 친구 모두
        기념품을 받아요. (약 {days}일 남음)
      </p>
      <div className="l-festival-souvenir">
        {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art. */}
        <img src={FURNITURE_ART[fest.souvenir]} alt="" />
        <span>
          <strong>이번 주 기념품 · {souvenir?.name ?? '축제 기념품'}</strong>
          <small>내 방 꾸미기의 “내 가구”에 생겨요. 주마다 다른 기념품이 돌아가요.</small>
        </span>
      </div>
      <ul className="l-bundle-slots">
        <li data-full={!left || undefined}>
          <Coins size={30} className="l-bundle-coin" aria-hidden="true" />
          <span className="l-slot-text">
            <strong>이번 주 축제 기금</strong>
            <progress max={fest.goal} value={fest.got} aria-label="축제 기금 모은 범" />
            <small data-testid="festival-progress">
              {formatBeom(fest.got)} / {formatBeom(fest.goal)} · 내가 보탠 {formatBeom(mine)}
              {mine >= FESTIVAL_SOUVENIR_MIN ? ' · 기념품 조건 달성' : ''}
            </small>
          </span>
          {!fest.done && left > 0 && (
            <span className="l-slot-give">
              <GiveSteps left={left} value={amount} onPick={setGive} label="보탤 범" base={[10_000, FESTIVAL_SOUVENIR_MIN, 50_000]} />
              <button
                type="button"
                className="l-primary"
                disabled={busy || view.wallet.balance < amount}
                onClick={() =>
                  void run({ kind: 'festival', n: amount }, `마을 축제 기금에 ${formatBeom(amount)}을 보탰어요.`).then((ok) => {
                    if (ok) lifeSfx('donate');
                  })
                }
                data-testid="festival-give"
              >
                보태기
              </button>
            </span>
          )}
        </li>
      </ul>
      {fest.done && (
        <p className="l-bundle-done" data-testid="festival-done">
          <Check size={16} aria-hidden="true" /> 이번 주 축제 기금이 다 모였어요! 다음 주 월요일에 새 기념품으로 다시 모아요.
        </p>
      )}
      <p className="l-bundle-helpers">
        <Users size={14} aria-hidden="true" /> {Object.keys(fest.by).length ? byAmount(fest.by) : '이번 주에는 아직 아무도 보태지 않았어요.'}
      </p>
    </section>
  );
}

function BundlePanel({ room, view, notify }: { room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const life = view.life!;
  const [picked, setPicked] = useState(() => {
    const open = BUNDLES.findIndex((b, i) => !life?.bundles?.[i]?.done);
    return Math.max(0, open);
  });
  const [amount, setAmount] = useState<Record<number, number>>({});
  const [run, busy] = useLifeAction(room, notify);
  const def = BUNDLES[picked];
  const state = life.bundles?.[picked];
  const got = state?.got ?? def.slots.map(() => 0);
  const doneCount = (life.bundles ?? []).filter((b) => b.done).length;
  const contribute = async (slot: number, n: number, label: string) => {
    const ok = await run({ kind: 'contribute', bundle: def.id, slot, n }, `${def.name}에 ${label}을 보탰어요.`);
    if (ok) {
      lifeSfx('donate');
      setAmount((p) => ({ ...p, [slot]: 1 }));
    }
  };
  return (
    <>
      <p className="l-modal-intro">
        <ClipboardList size={15} aria-hidden="true" /> 모두 함께 꾸러미를 채우면 마을이 조금씩 되살아나요. 완성되면 도운 친구 모두{' '}
        {formatBeom(BUNDLE_REWARD_BEOM)}과 기념패를 받아요. <b data-testid="bundles-done">{doneCount}/{BUNDLES.length}</b> 완성
      </p>
      <div className="l-board-body">
        <ul className="l-bundle-list" aria-label="꾸러미">
          {BUNDLES.map((b, i) => {
            const s = life.bundles?.[i];
            const filled = b.slots.reduce((sum, slot, k) => sum + Math.min(1, (s?.got[k] ?? 0) / slot.n), 0) / b.slots.length;
            return (
              <li key={b.id}>
                <button type="button" aria-pressed={picked === i} data-done={s?.done || undefined} onClick={() => setPicked(i)} data-testid={`bundle-${b.id}`}>
                  <span className="l-bundle-pin" aria-hidden="true">
                    {s?.done ? <Check size={16} /> : <Hammer size={14} />}
                  </span>
                  <span>
                    <strong>{b.name}</strong>
                    <small>{s?.done ? `완성 · ${b.reward}` : `${Math.round(filled * 100)}% · ${b.reward}`}</small>
                    <progress max={100} value={Math.round(filled * 100)} aria-label={`${b.name} 진행`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <section className="l-bundle-detail" aria-live="polite" data-testid="bundle-detail">
          <h3>
            {def.name} <small>{VILLAGE_FLAGS[def.flag]}</small>
          </h3>
          {state?.done ? (
            <p className="l-bundle-done">
              <Check size={16} aria-hidden="true" /> 완성! {josa(def.reward, '이/가')} 마을에 생겼어요.
            </p>
          ) : null}
          <ul className="l-bundle-slots">
            {def.slots.map((slot, k) => {
              const left = Math.max(0, slot.n - (got[k] ?? 0));
              const beom = 'beom' in slot;
              const have = needHave(life.me, slot, view.wallet.balance);
              const n = Math.max(1, Math.min(amount[k] ?? (beom ? 10_000 : 1), left, have || 1));
              return (
                <li key={k} data-full={!left || undefined}>
                  {'item' in slot ? <ItemIcon id={slot.item} size={34} /> : <Coins size={30} className="l-bundle-coin" aria-hidden="true" />}
                  <span className="l-slot-text">
                    <strong>{needLabel(slot)}</strong>
                    <progress max={slot.n} value={got[k] ?? 0} aria-label={`${needLabel(slot)} 모은 양`} />
                    <small>
                      {beom ? `${formatBeom(got[k] ?? 0)} / ${formatBeom(slot.n)}` : `${got[k] ?? 0}/${slot.n}개`}
                      {!left ? ' · 다 채웠어요' : beom ? '' : ` · 나는 ${have}개`}
                    </small>
                  </span>
                  {!state?.done && left > 0 && (
                    <span className="l-slot-give">
                      {beom ? (
                        <span className="l-beom-steps" role="group" aria-label="보탤 범">
                          {BEOM_STEPS.filter((v) => v <= left).map((v) => (
                            <button key={v} type="button" aria-pressed={n === v} onClick={() => setAmount((p) => ({ ...p, [k]: v }))}>
                              {v >= 10_000 ? `${v / 10_000}만` : `${v / 1_000}천`}
                            </button>
                          ))}
                        </span>
                      ) : have > 1 ? (
                        <input
                          type="number"
                          min={1}
                          max={Math.min(left, have)}
                          value={n}
                          aria-label="보탤 개수"
                          onChange={(e) => setAmount((p) => ({ ...p, [k]: Number(e.target.value) || 1 }))}
                        />
                      ) : null}
                      <button
                        type="button"
                        className="l-primary"
                        disabled={busy || (beom ? view.wallet.balance < n : have < 1)}
                        onClick={() => void contribute(k, n, beom ? formatBeom(n) : `${needLabel(slot)} ${n}개`)}
                        data-testid={`bundle-give-${k}`}
                      >
                        보태기
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="l-bundle-helpers" data-testid="bundle-helpers">
            <Users size={14} aria-hidden="true" />{' '}
            {Object.keys(state?.contributors ?? {}).length
              ? Object.entries(state!.contributors)
                  .sort(([, a], [, b]) => b - a)
                  .map(([actor, times]) => `${ACTORS[Number(actor)] ?? '친구'} ${times}번`)
                  .join(' · ')
              : `아직 아무도 보태지 않았어요. ${josa('첫 번째 손길', '이/가')} 되어 주세요.`}
          </p>
        </section>
      </div>
    </>
  );
}
