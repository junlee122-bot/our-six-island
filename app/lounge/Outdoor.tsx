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
import { REGIONS, isDistrictArea, outdoorReturnPoint, regionToNetwork, type OutdoorArea } from '../lounge-areas';
import { DISTRICTS, districtOpen, type DistrictId } from '../lounge-districts';
import { prefetchDistrict } from '../lounge-district-models';
import type { NpcId } from '../lounge-npc-data';
import { MINE_ARRIVE, LIFT_EVERY, floorPick, mineStops } from '../lounge-mine';
import { GROWTH_REJECT } from '../lounge-growth';
import { NODE_INFO, type NodeKind } from '../lounge-growth-data';
import { itemName } from '../lounge-life-plus';
import { lifeSfx } from '../lounge-audio-life';
import { josa } from '../lounge-text';
import { useSettings } from '../lounge-settings';
import type { WalkPoint } from '../lounge-walk-world';
import type { AreaAction, DistrictCounter } from '../lounge-area-3d';
import type { FishingFramePhase } from '../lounge-fishing-frames';
import type { FarmTouch } from '../lounge-farm-view';
import type { ShopArea } from '../lounge-shop-interiors';
import { HARBOR_VOYAGE } from '../lounge-harbor-layout';
import { gameHourOf } from '../lounge-voyage-data';
import { FISH_BY_ID } from '../lounge-items';
import { Modal } from './Modal';
import type { Notify } from './Toast';

const loadAreaScene = () => import('../lounge-area-3d');
const AreaScene = lazy(() => loadAreaScene().then((m) => ({ default: m.AreaScene })));
/** Warms the region scene's code before the fade (a cold chunk would show a blank map). */
const preloadAreaScene = () => void loadAreaScene().catch(() => {});

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
  onResident,
  onRequests,
  onCounter,
  onFish,
  onSignpost,
  onFarm,
}: {
  room: CloudRoom;
  notify: Notify;
  /** The scene fade (plays `then` at the dark moment). */
  fade: (then: () => void) => void;
  /** Back in the village at this point (by the gate I left through). */
  onVillage: (at: { x: number; z: number }) => void;
  /** Talking to a resident out here (시장 거리). */
  onResident?: (npc: NpcId) => void;
  /** 시장 거리's request board. */
  onRequests?: () => void;
  /** A district counter (E at a shop door, a board or a stall); `enter`: walk into the shop's room. */
  onCounter?: (place: DistrictCounter, enter?: ShopArea) => void;
  /** The harbor's fishing and crab-pot spots. */
  onFish?: (spot: 'breakwater' | 'pier' | 'offshore') => void;
  /** 친구에게 가기. */
  onSignpost?: () => void;
  /** 우리 농장: my field, a friend's field, a house door, the bin, the mailbox, the board. */
  onFarm?: (touch: FarmTouch) => void;
}) {
  const [outdoor, setOutdoor] = useState<Outdoor | null>(null);
  const [liftOpen, setLiftOpen] = useState(false);
  const [{ dayNight }] = useSettings();
  const ref = useRef(outdoor);
  /** Which way I came down into the mine (뒷산's cave or 산기슭 마을's entrance): the way back up. */
  const mineFrom = useRef<'hill' | 'foothill'>('hill');
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
    preloadAreaScene();
    go({ area: 'hill', spawn: { ...REGIONS.hill.arrive.village! } });
  }, [room, notify, go]);

  /** A district gate on the hub's rim: 시장 거리 is open in stage 1; the rest say what opens them. */
  const toDistrict = useCallback(
    (id: DistrictId) => {
      const life = room.snapshot().life;
      if (!districtOpen(id, { flags: life?.flags, pass: life?.districts?.pass })) {
        notify(`${DISTRICTS[id].name}: ${DISTRICTS[id].hint}`);
        return;
      }
      if (!isDistrictArea(id)) return;
      preloadAreaScene();
      void prefetchDistrict(id);
      go({ area: id, spawn: { ...REGIONS[id].arrive.village! } });
    },
    [notify, go, room],
  );

  /**
   * 친구에게 가기: straight to a district's arrival point (from anywhere
   * outdoors or the hub); 'village' walks back out through the current gate.
   */
  const travel = useCallback(
    (area: 'village' | DistrictId) => {
      if (area === 'village') {
        const from = ref.current?.area;
        if (!from) return;
        fade(() => {
          setOutdoor(null);
          ref.current = null;
          onVillage(outdoorReturnPoint(from));
        });
        return;
      }
      if (!isDistrictArea(area)) return;
      if (!districtOpen(area, { flags: room.snapshot().life?.flags, pass: room.snapshot().life?.districts?.pass })) return;
      preloadAreaScene();
      void prefetchDistrict(area);
      go({ area, spawn: { ...REGIONS[area].arrive.village! } });
    },
    [fade, go, onVillage, room],
  );

  /** 먼바다: onto the deck when my boat leaves, back on the pier when it is over. */
  const toDeck = useCallback(() => {
    preloadAreaScene();
    go({ area: 'offshore', spawn: { ...REGIONS.offshore.arrive.harbor! } });
  }, [go]);
  const toPier = useCallback(() => {
    preloadAreaScene();
    void prefetchDistrict('harbor');
    go({ area: 'harbor', spawn: { ...HARBOR_VOYAGE.landing } });
  }, [go]);

  const leaveToVillage = () => {
    const from = ref.current?.area ?? 'hill';
    fade(() => {
      setOutdoor(null);
      ref.current = null;
      onVillage(outdoorReturnPoint(from));
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
    const r = regions(),
      m = r?.mine;
    if (!r || !m) return;
    mineFrom.current = ref.current?.area === 'foothill' ? 'foothill' : 'hill';
    if (!r.pass && m.pickaxe < floorPick(1)) return notify(GROWTH_REJECT.minePick);
    // With the lift (or 승준's explorer pass, every floor): pick a floor.
    if (r.pass || (m.lift && m.deep >= LIFT_EVERY)) setLiftOpen(true);
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
      case 'npc':
        onResident?.(a.npc);
        return;
      case 'board':
        onRequests?.();
        return;
      case 'counter':
        onCounter?.(a.place, a.enter);
        return;
      case 'fish':
        onFish?.(a.spot);
        return;
      case 'signpost':
        onSignpost?.();
        return;
      case 'farm':
        if (!a.disabled) onFarm?.(a.touch);
        return;
      case 'exit':
        if (a.to === 'village') return leaveToVillage();
        if (a.to === 'mine') return enterMine();
        if (a.to === 'woods') return go({ area: 'woods', spawn: { ...REGIONS.woods.arrive.hill! } });
        if (a.to === 'hill') {
          if (o.area === 'mine') {
            // Back out the way I came in (산기슭 광산 입구 or 뒷산's cave).
            const up = mineFrom.current;
            void act({ kind: 'mineGo', floor: 0 }).then((ok) => ok && go({ area: up, spawn: { ...REGIONS[up].arrive.mine! } }));
          }
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
    fishing,
    onChat,
    onBag,
    axeTier,
  }: {
    view: CloudRoomView;
    players: LoungePlayer[];
    self: string | null;
    me: { actor: number; look: Look };
    paused: boolean;
    fishing?: FishingFramePhase | null;
    onChat: () => void;
    onBag: () => void;
    axeTier: number;
  }): ReactNode => {
    if (!outdoor) return null;
    const r = view.life?.growth?.regions ?? null;
    const m = r?.mine;
    // 승준's explorer pass: every floor, even past the pickaxe (lounge-explorer-pass.ts).
    const pass = !!r?.pass;
    const stops = m ? mineStops(m, pass, view.life?.growth?.mods.liftPlus ?? 0) : [];
    // 먼바다 낚싯배: the deck holds still after a 멀미약; the harbor's boat is out while anyone sails.
    const voyage = view.life?.voyage;
    // 샹크스 is at the pier through the game day's sailings (game 05–19).
    const hour = gameHourOf(Date.now() + view.clockOffset);
    const harborBoat = voyage ? { out: voyage.sailing.length > 0, captain: !voyage.storm && hour >= 5 && hour < 19 } : undefined;
    // A big fish (rare or better) just landed out at sea: it jumps once by the bobber.
    const last = view.life?.angling?.me.last;
    const bigCatch = outdoor.area === 'offshore' && last?.ok && last.fish && (FISH_BY_ID[last.fish]?.weight ?? 99) < 10 ? last.at : 0;
    return (
      <div className="l-village-world">
        <Suspense
          fallback={
            <div className="l-empty l-screen-loading l-scene-wait" data-testid="area-loading">
              <p>
                <span className="l-spinner" /> {josa(REGIONS[outdoor.area].name, '으로/로')} 가는 중…
              </p>
            </div>
          }
        >
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
            fishing={fishing}
            dayNight={dayNight}
            steady={!!voyage?.pillUntil}
            bigCatch={bigCatch}
            harborBoat={harborBoat}
            life={outdoor.area === 'farm' ? view.life : null}
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
          <Modal title={pass ? '광산 층 고르기' : '광산 승강기'} onClose={() => setLiftOpen(false)}>
            <p className="l-muted">
              {pass
                ? '탐험 패스로 어느 층이든 갈 수 있어요. 바위는 곡괭이 단계가 맞아야 깨져요.'
                : `가 본 층까지 ${LIFT_EVERY}층마다 내려갈 수 있어요. 곡괭이 단계가 모자라면 그 층에는 못 가요.`}
              {m.vein ? ` 오늘의 광맥은 ${m.vein}층이에요.` : ''}
            </p>
            <div className="ar-lift" data-testid="mine-lift">
              {stops.map(({ floor: f, pick }) => (
                <button key={f} type="button" disabled={f === m.at || (!pass && pick !== null)} onClick={() => void goFloor(f)}>
                  {f}층
                  <small>{f === m.at ? '지금 여기' : pick !== null ? `곡괭이 ${pick}단계` : f === 1 ? '입구' : pass ? '탐험 패스' : '승강장'}</small>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  };
  /** Out of a shop's room: straight back to this district spot (the caller fades). */
  const enterAt = useCallback(
    (o: Outdoor) => {
      preloadAreaScene();
      setOutdoor(o);
      ref.current = o;
      tell(o);
    },
    [tell],
  );
  /** Leaves the region at once (another screen took over: a menu, a door…). */
  const reset = useCallback(() => {
    const was = ref.current;
    ref.current = null;
    setOutdoor(null);
    setLiftOpen(false);
    return was;
  }, []);
  return { outdoor, outdoorRef: ref, toHill, toDistrict, travel, render, tell, reset, enterAt, toDeck, toPier };
}
