'use client';
// 마을 게시판: the eight village bundles everyone fills together (items or 범),
// who helped, and what each one restores in the village.
import { useState } from 'react';
import { Check, ClipboardList, Coins, Hammer, Users } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { BUNDLES, BUNDLE_REWARD_BEOM, VILLAGE_FLAGS } from '../lounge-items';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { needHave, needLabel } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { useLifeAction } from './LifePanels';
import './life-plus.css';

const BEOM_STEPS = [1_000, 10_000, 50_000];

export function BundleBoard({
  room,
  view,
  notify,
  onClose,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
}) {
  const life = view.life;
  const [picked, setPicked] = useState(() => {
    const open = BUNDLES.findIndex((b, i) => !life?.bundles?.[i]?.done);
    return Math.max(0, open);
  });
  const [amount, setAmount] = useState<Record<number, number>>({});
  const [run, busy] = useLifeAction(room, notify);
  if (!life)
    return (
      <Modal title="마을 게시판" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 게시판을 볼 수 있어요.</p>
      </Modal>
    );
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
    <Modal title="마을 게시판" onClose={onClose} className="l-life-modal l-board" wide>
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
    </Modal>
  );
}
