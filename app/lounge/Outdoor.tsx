'use client';
// 성장 P2: going out of the village to 뒷산 / 숲 깊은 곳 / 광산. A small hook
// that keeps which region I am in (the village tab stays the tab; a region
// replaces the village scene while I am out), tells the server where I am,
// and runs the region's actions (nodes, mine rocks, ladder, lift, the log
// gate, exits). lounge-game.tsx only mounts it; the scene is lounge-area-3d.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Backpack, MessageCircle } from '../ui/icons';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LoungePlayer } from '../lounge-room';
import type { Look } from '../lounge-look';
import { REGIONS, VILLAGE_GATE, regionToNetwork, type OutdoorArea } from '../lounge-areas';
import { MINE_ARRIVE, LIFT_EVERY, floorPick } from '../lounge-mine';
import { GROWTH_REJECT } from '../lounge-growth';
import { NODE_INFO, type NodeKind } from '../lounge-growth-data';
import { itemName } from '../lounge-life-plus';
import { lifeSfx } from '../lounge-audio-life';
import { josa } from '../lounge-text';
import type { WalkPoint } from '../lounge-walk-world';
import type { AreaAction } from '../lounge-area-3d';
import { Modal } from './Modal';
import type { Notify } from './Toast';

const AreaScene = lazy(() => import('../lounge-area-3d').then((m) => ({ default: m.AreaScene })));

export type Outdoor = { area: OutdoorArea; spawn: WalkPoint };
/** Items a region action can give (for the "얻었어요" line). */
const GAIN_ITEMS = [
  'wood',
  'stone',
  'copper',
  'iron',
  'gold',
  'gem',
  'hardwood',
  'songi',
  'yeongji',
  'fossil-shell',
  'fossil-leaf',
  'fossil-fish',
  'fossil-fern',
  'fossil-trilobite',
  'fossil-tooth',
];

export function useOutdoor({
  room,
  notify,
  fade,
  onVillage,
}: {
  room: CloudRoom;
  notify: Notify;
  /** The scene fade (plays `then` at the dark moment). */
  fade: (then: () => void) => void;
  /** Back in the village at this point (by the north gate). */
  onVillage: (at: { x: number; z: number }) => void;
}) {
  const [outdoor, setOutdoor] = useState<Outdoor | null>(null);
  const [liftOpen, setLiftOpen] = useState(false);
  const ref = useRef(outdoor);
  useEffect(() => {
    ref.current = outdoor;
  }, [outdoor]);

  const tell = useCallback(
    (o: Outdoor) => {
      if (room.snapshot().status !== 'connected') return;
      const p = regionToNetwork(o.area, o.spawn);
      void room.area(o.area, p.x, p.y);
    },
    [room],
  );
  const go = useCallback(
    (o: Outdoor | null) => {
      fade(() => {
        setOutdoor(o);
        ref.current = o;
        if (o) tell(o);
      });
    },
    [fade, tell],
  );
  /** Server rejections come back as the room's error toast; this only runs on success. */
  const act = (a: Parameters<CloudRoom['life']>[0]) => room.life(a);
  const regions = () => room.snapshot().life?.growth?.regions ?? null;

  /** The village's north gate: up to 뒷산 once 산길 정비 is done. */
  const toHill = useCallback(() => {
    const r = room.snapshot().life?.growth?.regions;
    if (!r?.hill.open) {
      notify('마을 개척 “산길 정비”가 끝나면 뒷산에 올라갈 수 있어요.');
      return;
    }
    go({ area: 'hill', spawn: { ...REGIONS.hill.arrive.village! } });
  }, [room, notify, go]);

  const leaveToVillage = () => {
    fade(() => {
      setOutdoor(null);
      ref.current = null;
      onVillage({ ...VILLAGE_GATE.stand });
    });
  };
  const goFloor = async (floor: number) => {
    if (!(await act({ kind: 'mineGo', floor }))) return false;
    setLiftOpen(false);
    go({ area: 'mine', spawn: { ...MINE_ARRIVE } });
    if (floor > 1) notify(`광산 ${floor}층이에요.`);
    return true;
  };
  const enterMine = () => {
    const m = regions()?.mine;
    if (!m) return;
    if (m.pickaxe < floorPick(1)) return notify(GROWTH_REJECT.minePick);
    // With the lift: pick a lift floor (or 1층).
    if (m.lift && m.deep >= LIFT_EVERY) setLiftOpen(true);
    else void goFloor(1);
  };
  const gain = async (run: () => Promise<boolean>) => {
    const inv = () => room.snapshot().life?.me.inv ?? {};
    const before = { ...inv() };
    if (!(await run())) return null;
    const after = inv();
    return GAIN_ITEMS.map((id) => [id, (after[id] ?? 0) - (before[id] ?? 0)] as const).filter(([, n]) => n > 0);
  };
  const say = (got: readonly (readonly [string, number])[]) => got.map(([id, n]) => `${itemName(id)} ${n}`).join(' · ');

  const onAction = (a: AreaAction) => {
    const o = ref.current;
    if (!o) return;
    switch (a.kind) {
      case 'node': {
        const kind: NodeKind = a.node;
        void gain(() => act({ kind: kind === 'rock' ? 'smash' : 'chop', node: a.id })).then((got) => {
          if (!got) return;
          notify(`${josa(NODE_INFO[kind].name, '을/를')} ${kind === 'shroom' ? '살폈어요' : kind === 'rock' ? '깼어요' : '베었어요'}! ${say(got)}`);
          lifeSfx(kind === 'rock' ? 'smash' : 'chop');
        });
        return;
      }
      case 'rock': {
        const floor = regions()?.mine.at ?? 0,
          hadLadder = !!regions()?.mine.ladder;
        void gain(() => act({ kind: 'mineRock', floor, rock: a.rock })).then((got) => {
          if (!got) return;
          const fossil = got.find(([id]) => id.startsWith('fossil-'));
          const ladder = !hadLadder && regions()?.mine.ladder ? ' · 아래층으로 가는 사다리가 보여요!' : '';
          notify(
            fossil
              ? `화석이에요! ${itemName(fossil[0])} · 박물관에 기증할 수 있어요${ladder}`
              : `바위를 깼어요! ${say(got) || '돌 부스러기뿐이에요'}${ladder}`,
          );
          lifeSfx('smash');
        });
        return;
      }
      case 'ladder': {
        const at = regions()?.mine.at ?? 1;
        void goFloor(at + 1);
        return;
      }
      case 'lift':
        setLiftOpen(true);
        return;
      case 'gate':
        void act({ kind: 'clearGate', gate: a.gate }).then((ok) => {
          if (!ok) return;
          notify('쓰러진 통나무를 쪼갰어요! 숲 깊은 곳으로 가는 길이 열렸어요.');
          lifeSfx('chop');
        });
        return;
      case 'exit':
        if (a.to === 'village') return leaveToVillage();
        if (a.to === 'mine') return enterMine();
        if (a.to === 'woods') return go({ area: 'woods', spawn: { ...REGIONS.woods.arrive.hill! } });
        if (a.to === 'hill') {
          if (o.area === 'mine')
            void act({ kind: 'mineGo', floor: 0 }).then((ok) => ok && go({ area: 'hill', spawn: { ...REGIONS.hill.arrive.mine! } }));
          else go({ area: 'hill', spawn: { ...REGIONS.hill.arrive[o.area]! } });
        }
        return;
    }
  };

  const render = ({
    view,
    players,
    self,
    me,
    paused,
    onChat,
    onBag,
    axeTier,
  }: {
    view: CloudRoomView;
    players: LoungePlayer[];
    self: string | null;
    me: { actor: number; look: Look };
    paused: boolean;
    onChat: () => void;
    onBag: () => void;
    axeTier: number;
  }): ReactNode => {
    if (!outdoor) return null;
    const r = view.life?.growth?.regions ?? null;
    const m = r?.mine;
    const liftFloors = m ? [1, ...Array.from({ length: Math.floor(m.deep / LIFT_EVERY) }, (_, i) => (i + 1) * LIFT_EVERY)] : [1];
    return (
      <div className="l-village-world">
        <Suspense fallback={null}>
          <AreaScene
            area={outdoor.area}
            spawn={outdoor.spawn}
            players={players}
            self={self}
            me={me}
            regions={r}
            clockOffset={view.clockOffset}
            axeTier={axeTier}
            paused={paused || liftOpen}
            onMove={(x, y) => {
              if (room.snapshot().status === 'connected') void room.action({ kind: 'move', x, y });
            }}
            onAction={onAction}
          />
        </Suspense>
        <div className="l-world-social">
          <button className="l-world-chat-button" aria-label="마을 수다 열기" onClick={onChat}>
            <MessageCircle size={19} />
            <span>수다</span>
          </button>
          <button className="l-world-chat-button" aria-label="가방 열기" onClick={onBag} data-bind="inventory">
            <Backpack size={19} />
            <span>가방</span>
          </button>
        </div>
        {liftOpen && m && (
          <Modal title="광산 승강기" onClose={() => setLiftOpen(false)}>
            <p className="l-muted">가 본 층까지 {LIFT_EVERY}층마다 내려갈 수 있어요. 곡괭이 단계가 모자라면 그 층에는 못 가요.</p>
            <div className="ar-lift" data-testid="mine-lift">
              {liftFloors.map((f) => (
                <button key={f} type="button" disabled={f === m.at || floorPick(f) > m.pickaxe} onClick={() => void goFloor(f)}>
                  {f}층
                  <small>{f === m.at ? '지금 여기' : floorPick(f) > m.pickaxe ? `곡괭이 ${floorPick(f)}단계` : f === 1 ? '입구' : '승강장'}</small>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  };
  /** Leaves the region at once (another screen took over: a menu, a door…). */
  const reset = useCallback(() => {
    const was = ref.current;
    ref.current = null;
    setOutdoor(null);
    setLiftOpen(false);
    return was;
  }, []);
  return { outdoor, outdoorRef: ref, toHill, render, tell, reset };
}
