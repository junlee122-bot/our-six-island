'use client';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  ClipboardList,
  CookingPot,
  Heart,
  House,
  Newspaper,
  Sparkles,
  Info,
  Mail,
  MessageCircle,
  MessageSquareQuote,
  RotateCcw,
  Settings,
  Shirt,
  Spade,
  Sprout,
  Store,
  Users,
} from 'lucide-react';
import { AvatarView } from './avatar-view';
import {
  villageFromNetwork,
  villageToNetwork,
  VILLAGE_PLACES,
  VILLAGE_START,
  type VillageDestination,
  type VillagePlace,
  type VillagePoint,
} from './lounge-village-layout';
import { villageReturnPoint } from './lounge-village-entrance';
import './lounge-club.css';
import './lounge-village-shell.css';
import './lounge-flow.css';
import { sceneSeatPoint, sceneTableSide } from './lounge-scene-layout';
import { LoungePlayHub } from './lounge-play-hub';
import { gameFlow } from './lounge-game-flow';
import {
  AREA_DEFAULTS,
  GAME_INFO,
  GAME_KINDS,
  TABLE_AREA,
  type GameKind,
} from './lounge-games';
import {
  mySeat,
  TABLE_PLACE,
  tableAction,
  tableState,
} from './lounge-table-state';
import { TableSheet, type SheetMode } from './lounge/TableSheet';
import { loungeAudio } from './lounge-audio';
import {
  FarmModal,
  MailModal,
  ShopModal,
  StatusModal,
  type ShopTab,
} from './lounge/LifePanels';
import { InventoryPanel } from './lounge/Inventory';
import { CalendarChip, Hotbar, useHotbar, useHotbarKeys } from './lounge/LifeHud';
import { FishingOverlay, type FishingPhase } from './lounge/Fishing';
import { CollectionBook, type BookTab } from './lounge/Collection';
import { KitchenPanel } from './lounge/Kitchen';
import { BundleBoard } from './lounge/Bundles';
import { DigestCard, FriendsLife, MemoriesAlbum, RequestCard } from './lounge/Bonds';
import { Celebration, useLifeEvents } from './lounge/use-life-events';
import { lifeSfx } from './lounge-audio-life';
import { farmToolAction, furnitureUnlocks } from './lounge-life-ui';
import { itemName } from './lounge-life-plus';
import { DISH_BY_ID, BUFF_INFO, type Spot } from './lounge-items';
import type { Crop } from './lounge-life';
import { BOARD_FRONT, MUSEUM_FRONT } from './lounge-village-spots';
import { FriendVisitScreen, prefetchVisit } from './lounge/FriendVisit';
import type { GameInvite, LoungePlayer } from './lounge-room';
import { CloudRoom, type Area, type CloudRoomView } from './lounge-cloud-room';
import { AccountGate } from './lounge-account-ui';
import { accountLogout, accountLogoutAll } from './lounge-auth';
import { accountSave, type AccountProfile } from './lounge-accounts';
import { useCloudSave } from './lounge-cloud-save';
import { freshLounge, type LoungeSave } from './lounge-look';
import { ACTORS } from './lounge-roster';
import { LOUNGE_ASSETS } from './lounge-assets';
import { ReactionDock } from './lounge-reaction-ui';
import {
  REACTION_TTL,
  type Reaction,
  type ReactionId,
} from './lounge-reactions';
import { formatBeom, josa, NAMES } from './lounge-text';
import {
  PASSWORD_WARNING_KEY,
  recall,
  remember,
  useSettings,
} from './lounge-settings';
import { Modal, ConfirmModal } from './lounge/Modal';
import { Toast, useBanners } from './lounge/Toast';
import { dailyOf } from './lounge/WalletModal';
import { ChatPanel } from './lounge/ChatPanel';
import { FriendsModal } from './lounge/FriendsModal';
import { Invitations } from './lounge/Invitations';
import { RequestGameModal } from './lounge/RequestGameModal';
import { WalletModal } from './lounge/WalletModal';
import { AccountModal } from './lounge/AccountModal';
import { SettingsModal } from './lounge/SettingsModal';
import { CreditsModal } from './lounge/CreditsModal';
import { WorldHeader, type Tab } from './lounge/WorldHeader';
import { GameScreen, myTurn } from './lounge/GameScreen';
import {
  Onboarding,
  shouldOnboard,
  shouldOnboardRoom,
} from './lounge/Onboarding';
import { VillageSimple } from './lounge/VillageSimple';
import {
  ErrorState,
  lazyRetry,
  ScreenBoundary,
} from './lounge/ErrorBoundary';
import { SaveStatus } from './lounge/SaveStatus';
import { GAME_COPY } from './lounge/game-copy';
import { inviteEndReason, nameOf } from './lounge/invite-text';
import {
  attention,
  closeAudio,
  friendlyError,
  playCue,
} from './lounge/feedback';

// Heavy screens load on demand (WS5 enables code splitting in the build).
// lazyRetry reloads once when a chunk vanished after a redeploy.
const loadVillage = () => import('./lounge-village');
const loadBedroom = () => import('./lounge-bedroom');
const loadWardrobe = () => import('./lounge-wardrobe');
const loadScene = () => import('./lounge-scene');
const Village3D = lazyRetry(() =>
  loadVillage().then((m) => ({ default: m.Village3D })),
);
const BedroomEditor = lazyRetry(() =>
  loadBedroom().then((m) => ({ default: m.BedroomEditor })),
);
const Wardrobe = lazyRetry(() =>
  loadWardrobe().then((m) => ({ default: m.Wardrobe })),
);
const RoomFloor = lazyRetry(() =>
  loadScene().then((m) => ({ default: m.RoomFloor })),
);

/**
 * Walking up to a door starts loading what is behind it (the lazy chunk and
 * its art), so going in plays the short transition instead of a spinner.
 */
const warmed = new Set<string>();
function preloadTab(tab: Tab, save?: LoungeSave) {
  const quiet = (job: Promise<unknown>) => void job.catch(() => {});
  if (tab === 'village')
    quiet(loadVillage().then((m) => m.preloadVillage()));
  else if (tab === 'bedroom')
    quiet(loadBedroom().then((m) => save && m.preloadBedroom(save)));
  else if (tab === 'wardrobe') quiet(loadWardrobe());
  else {
    quiet(loadScene());
    for (const url of [
      tab === 'casino' ? LOUNGE_ASSETS.casino : LOUNGE_ASSETS.room,
      LOUNGE_ASSETS.clubTable,
    ]) {
      if (warmed.has(url)) continue;
      warmed.add(url);
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
    }
  }
}

/**
 * The ~300 ms scene change: an iris closes to black, the place changes, the
 * iris opens again (a quick dim crossfade under reduced motion). Web
 * Animations keep it independent of the reduced-motion CSS reset.
 */
function useSceneFade() {
  const ref = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const play = useCallback((run: () => void) => {
    const el = ref.current;
    const iris = el?.firstElementChild as HTMLElement | null;
    if (!el || !iris || busy.current || typeof el.animate !== 'function') {
      run();
      return;
    }
    busy.current = true;
    let reduced = false;
    try {
      reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {}
    const half = reduced ? 110 : 150;
    // power1.inOut
    const easing = 'cubic-bezier(0.45, 0, 0.55, 1)';
    el.classList.add('is-active');
    el.classList.toggle('is-plain', reduced);
    el.dataset.state = 'closing';
    const shut = reduced
      ? [{ opacity: 0 }, { opacity: 0.85 }]
      : [{ opacity: 1 }, { opacity: 1 }];
    el.animate(shut, { duration: half, fill: 'forwards', easing });
    const irisFrames = [
      { width: '150vmax', height: '150vmax' },
      { width: '0px', height: '0px' },
    ];
    if (!reduced)
      iris.animate(irisFrames, { duration: half, fill: 'forwards', easing });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      el.dataset.state = 'opening';
      const open = el.animate(
        reduced ? [{ opacity: 0.85 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 1 }],
        { duration: half, fill: 'forwards', easing },
      );
      if (!reduced)
        iris.animate([...irisFrames].reverse(), {
          duration: half,
          fill: 'forwards',
          easing,
        });
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        el.getAnimations().forEach((a) => a.cancel());
        iris.getAnimations().forEach((a) => a.cancel());
        // Hidden (display: none) whenever idle, whatever the animations did.
        el.classList.remove('is-active');
        el.dataset.state = '';
        busy.current = false;
      };
      open.onfinish = cleanup;
      setTimeout(cleanup, half + 400);
    };
    setTimeout(() => {
      try {
        run();
      } finally {
        // Two frames for the new place to paint (its chunk was preloaded).
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(finish, 40)));
        setTimeout(finish, 700);
      }
    }, half);
  }, []);
  const node = (
    <div ref={ref} className="l-scene-fade" aria-hidden="true" data-testid="scene-fade">
      <i />
    </div>
  );
  return [node, play] as const;
}

/** Failure screen for a lazily loaded place: retry (or reload) and a way out. */
function ScreenError({
  what,
  retry,
  chunk,
  onBack,
}: {
  what: string;
  retry: () => void;
  chunk: boolean;
  onBack?: () => void;
}) {
  return (
    <ErrorState
      title={`${josa(what, '을/를')} 열지 못했어요.`}
      body={
        chunk
          ? '새 버전이 올라왔을 수 있어요. 새로 고치면 저장된 내용은 그대로예요.'
          : '잠시 뒤 다시 시도해 주세요. 저장된 내용은 그대로예요.'
      }
      retryLabel={chunk ? '새로 고치기' : '다시 시도'}
      onRetry={chunk ? () => location.reload() : retry}
      onBack={onBack}
      backLabel="나가기"
    />
  );
}

export { GameScreen };

type ModalName =
  | 'friends'
  | 'credits'
  | 'request'
  | 'games'
  | 'invitations'
  | 'wallet'
  | 'account'
  | 'menu'
  | 'chat'
  | 'settings'
  | 'farm'
  | 'bag'
  | 'shop'
  | 'mail'
  | 'status'
  // Life expansion (LIFE-B).
  | 'collection'
  | 'kitchen'
  | 'board'
  | 'bonds'
  | 'memories'
  | 'digest'
  | 'lifeRequest';
type Confirm = 'leaveRoom' | 'logout' | 'logoutAll' | 'reset';

const TAB_AREA: Record<Tab, Area> = {
  village: 'village',
  lounge: 'lounge',
  casino: 'casino',
  wardrobe: 'wardrobe',
  bedroom: 'home',
};

const VILLAGE_HINT_KEY = 'bumtadew-village-hint-v1';
/**
 * First visit only: a short "how to walk" note under the header for a few
 * seconds (after the coach marks), then never again on this device.
 */
function VillageHint({ paused }: { paused: boolean }) {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(VILLAGE_HINT_KEY) === null;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show || paused) return;
    try {
      localStorage.setItem(VILLAGE_HINT_KEY, 'seen');
    } catch {
      // Private mode: the hint simply shows again next time.
    }
    const timer = window.setTimeout(() => setShow(false), 6500);
    return () => window.clearTimeout(timer);
  }, [show, paused]);
  if (!show || paused) return null;
  return (
    <output className="l-world-hint">
      바닥을 눌러 걷고, 마을 안내에서 장소를 찾아요
      <span> · 방향키 / WASD · Shift 달리기 · E 오른쪽 아래 버튼</span>
    </output>
  );
}

/** Still loading after the transition: a calm backdrop; the spinner shows only if it takes long. */
function Loading({ text }: { text: string }) {
  return (
    <div className="l-empty l-screen-loading l-scene-wait">
      <p>
        <span className="l-spinner" /> {text}
      </p>
    </div>
  );
}

/** The game I would forfeit or void by leaving the room right now. */
function activeCommitment(view: CloudRoomView): {
  kind: GameKind | null;
  invite: GameInvite | null;
} {
  const kind =
    GAME_KINDS.find((k) => view.tables?.[k]?.members.includes(view.self)) ??
    GAME_KINDS.find((k) => view.seats[k].includes(view.self)) ??
    null;
  const invite =
    view.invites.find(
      (r) => r.status === 'waiting' && r.accepted.includes(view.self),
    ) ?? null;
  return { kind, invite };
}

export default function LoungeGame() {
  return (
    <AccountGate>
      {(account, onLogout) => (
        <AccountLounge key={account.id} account={account} onLogout={onLogout} />
      )}
    </AccountGate>
  );
}

function AccountLounge({
  account,
  onLogout,
}: {
  account: AccountProfile;
  onLogout: () => void;
}) {
  const cloudSave = useCloudSave(account),
    { save, change: setSave } = cloudSave;
  const [room] = useState(() => new CloudRoom(account)),
    view = useSyncExternalStore(room.subscribe, room.snapshot, room.snapshot),
    [settings, updateSettings] = useSettings(),
    banners = useBanners(),
    { notify, push: pushBanner, drop: dropBanner } = banners,
    // The day starts in my own room, next to the bed.
    [tab, setTab] = useState<Tab>('bedroom'),
    [roomSpawn, setRoomSpawn] = useState<'bed' | 'door'>('bed'),
    // The wardrobe opened from my room ("옷 갈아입기") returns there.
    [wardrobeFrom, setWardrobeFrom] = useState<'village' | 'bedroom'>('village'),
    [modal, setModal] = useState<ModalName | null>(null),
    [confirm, setConfirm] = useState<Confirm | null>(null),
    [gameScreen, setGameScreen] = useState<GameKind | null>(null),
    // The table sheet I opened by walking up to a table (setup / join). The
    // seated sheet follows my seat instead (see tableSheet below).
    [sheet, setSheet] = useState<{ game: GameKind; call?: string[] } | null>(
      null,
    ),
    [request, setRequest] = useState<{
      kind: GameKind | null;
      preselect?: string[];
    }>({
      kind: null,
    }),
    // Offline mode keeps one position per area so the village's coordinates
    // never leak into the hall (where they could start inside a table).
    [localPos, setLocalPos] = useState<Record<'village' | 'lounge' | 'casino', { x: number; y: number }>>({
      village: AREA_DEFAULTS.village,
      lounge: AREA_DEFAULTS.lounge,
      casino: AREA_DEFAULTS.casino,
    }),
    [visiting, setVisiting] = useState<number | null>(null),
    [mailTo, setMailTo] = useState<number | undefined>(undefined),
    [localReaction, setLocalReaction] = useState<Reaction>(),
    [villageSpawn, setVillageSpawn] = useState<VillagePoint>(),
    [coach, setCoach] = useState<'room' | 'village' | null>(null);
  const [fade, playFade] = useSceneFade();
  // Life expansion (LIFE-B): panels, the hotbar and fishing.
  const [bookTab, setBookTab] = useState<BookTab>('fish'),
    [atMuseum, setAtMuseum] = useState(false),
    [shopTab, setShopTab] = useState<ShopTab>('seeds'),
    [mailGift, setMailGift] = useState<string | undefined>(undefined),
    [requestFrom, setRequestFrom] = useState<number | null>(null),
    [fishing, setFishing] = useState<{ spot: Spot; phase: FishingPhase } | null>(null);
  const hotbar = useHotbar();
  const villagePosition = useRef<VillagePoint | undefined>(undefined),
    // Leaving my room at the start of the day comes out of my own front door.
    enteredPlace = useRef<VillagePlace | null>(
      VILLAGE_PLACES.find((p) => p.id === `home-${account.actor}`) ?? null,
    ),
    lookRef = useRef(save.looks[save.actor]),
    tabRef = useRef(tab);
  const myLook = save.looks[save.actor];
  useEffect(() => {
    lookRef.current = myLook;
    tabRef.current = tab;
  }, [myLook, tab]);
  const reactionsHidden = settings.reactionsHidden;
  const setReactionsHidden = useCallback(
    (reactionsHidden: boolean) => updateSettings({ reactionsHidden }),
    [updateSettings],
  );

  // Banner buttons run whatever is current when they are pressed.
  const flowRef = useRef({
    openMail: () => {},
    enterRoom: () => {},
    openGame: (_kind: GameKind) => {},
    openInvites: () => {},
    goToTable: (_kind: GameKind) => {},
  });
  // Village music, ambience and UI clicks (start after the first gesture).
  useEffect(() => loungeAudio.attach(), []);

  // New letters: a toast and a small chime (count only rises on arrival).
  const unread = view.life?.me.mailUnread ?? 0;
  const lastUnread = useRef<number | null>(null);
  useEffect(() => {
    if (lastUnread.current !== null && unread > lastUnread.current) {
      pushBanner('mail', `새 편지가 ${unread - lastUnread.current}통 왔어요.`, {
        key: 'mail',
        action: { label: '보기', run: () => flowRef.current.openMail() },
      });
      loungeAudio.chime('mail');
    }
    lastUnread.current = unread;
  }, [unread, pushBanner]);

  // Join the always-on village (or the room of an invite link) right after login.
  useEffect(() => {
    let invite: string | null = null;
    try {
      invite = new URLSearchParams(location.hash.slice(1)).get('lounge');
    } catch {}
    room.init(lookRef.current, invite);
    const first = setTimeout(() => {
      if (recall(PASSWORD_WARNING_KEY) === account.id) {
        remember(PASSWORD_WARNING_KEY, null);
        setModal('account');
        notify(
          '비밀번호가 받은 코드와 비슷해요. 내 계정에서 비밀번호를 바꿔 주세요.',
          'error',
        );
      } else if (shouldOnboard())
        setCoach(shouldOnboardRoom() && tabRef.current === 'bedroom' ? 'room' : 'village');
    }, 1200);
    return () => {
      clearTimeout(first);
      room.dispose();
      closeAudio();
    };
  }, [room, account.id, notify]);

  // Server errors → error toast (errorSeq makes repeated messages show again).
  useEffect(() => {
    if (view.errorSeq && view.error) notify(view.error, 'error');
  }, [view.errorSeq, view.error, notify]);

  // Open a game screen when a new match seats me (subscribed to the room store,
  // so state changes happen in the store callback rather than during render).
  useEffect(() => {
    const opened = new Map<GameKind, string>();
    let status = room.snapshot().status;
    const check = () => {
      const v = room.snapshot();
      if (v.status !== status) {
        status = v.status;
        if (v.status !== 'connected') setGameScreen(null);
      }
      if (v.status !== 'connected') return;
      for (const kind of GAME_KINDS) {
        const id = v[kind]?.id;
        if (id && opened.get(kind) !== id && v.seats[kind].includes(v.self)) {
          const first = opened.has(kind) || !!v[kind];
          opened.set(kind, id);
          setSheet(null);
          setModal(null);
          playCue('start');
          // The table's last seat filled: the screen moves into the table view.
          if (first) playFade(() => setGameScreen(kind));
          else setGameScreen(kind);
        }
      }
    };
    check();
    return room.subscribe(check);
  }, [room, playFade]);

  // Invite arrivals (attention) and endings (specific reasons). A table-forming
  // invite that calls me is a banner with [가기]: it walks me to the table.
  const inviteStates = useRef(new Map<string, GameInvite>());
  const previousPlayers = useRef<LoungePlayer[]>([]);
  useEffect(() => {
    for (const invite of view.invites) {
      const prev = inviteStates.current.get(invite.id);
      const involved =
        invite.from === view.self || invite.invited.includes(view.self);
      const game = GAME_INFO[invite.game].name;
      const calledNow =
        invite.status === 'waiting' &&
        invite.invited.includes(view.self) &&
        !invite.accepted.includes(view.self) &&
        !invite.declined.includes(view.self) &&
        invite.from !== view.self;
      const calledBefore =
        !!prev &&
        prev.invited.includes(view.self) &&
        !prev.accepted.includes(view.self) &&
        !prev.declined.includes(view.self);
      if (calledNow && !calledBefore && !(prev && invite.table && prev.accepted.includes(view.self))) {
        const from = nameOf(invite.from, view.players);
        const text = invite.table
          ? `${josa(from, '이/가')} ${TABLE_PLACE[TABLE_AREA[invite.game]]} ${game} 테이블로 불렀어요.`
          : invite.fill
            ? `${josa(from, '이/가')} ${game} 테이블 빈자리로 불렀어요.`
            : `${from}의 ${game} 초대가 왔어요.`;
        attention('invite', text);
        const kind = invite.game;
        pushBanner('invite', text, {
          key: 'invite-' + invite.id,
          action:
            invite.table || invite.fill
              ? { label: '가기', run: () => flowRef.current.goToTable(kind) }
              : { label: '보기', run: () => flowRef.current.openInvites() },
        });
      }
      // Answered / ended: its banner is no longer news.
      if (prev?.status === 'waiting' && !calledNow)
        dropBanner('invite-' + invite.id);
      // Someone sat down at the table I sit at.
      if (
        invite.table &&
        invite.status === 'waiting' &&
        prev &&
        invite.accepted.includes(view.self) &&
        prev.accepted.includes(view.self)
      )
        for (const id of invite.accepted)
          if (!prev.accepted.includes(id) && id !== view.self)
            pushBanner(
              'info',
              `${josa(nameOf(id, view.players), '이/가')} ${game} 테이블에 앉았어요 · ${invite.accepted.length}/${invite.required}명`,
              { key: 'table-' + invite.id },
            );
      if (invite.table) {
        // A forming table: standing up is my own choice; only its expiry is news.
        if (
          prev?.status === 'waiting' &&
          invite.status === 'expired' &&
          prev.accepted.includes(view.self)
        )
          notify(`${game} 테이블에 더 앉는 친구가 없어 자리를 정리했어요. 범은 빠지지 않았어요.`, 'info');
      } else if (
        prev?.status === 'waiting' &&
        (invite.status === 'cancelled' || invite.status === 'expired') &&
        involved
      )
        notify(
          inviteEndReason(
            prev,
            invite,
            view.players,
            previousPlayers.current,
            view.self,
          ),
          'info',
        );
      inviteStates.current.set(invite.id, invite);
    }
    const ids = new Set(view.invites.map((invite) => invite.id));
    for (const id of inviteStates.current.keys())
      if (!ids.has(id)) {
        inviteStates.current.delete(id);
        dropBanner('invite-' + id);
      }
    previousPlayers.current = view.players;
  }, [view.invites, view.players, view.self, notify, pushBanner, dropBanner]);

  // A game screen covers the shell (the village stays mounted and paused), and
  // closing it restores the shell's scroll position (e.g. in the hall).
  const inGame = !!gameScreen && view.status === 'connected';
  // The village music box fades out at game tables and returns afterwards.
  useEffect(() => loungeAudio.setScene({ game: inGame }), [inGame]);
  const appRef = useRef<HTMLElement>(null),
    shellScroll = useRef(0),
    wasInGame = useRef(inGame);
  useEffect(() => {
    appRef.current?.scrollTo({ top: 0 });
  }, [tab]);
  useLayoutEffect(() => {
    const app = appRef.current;
    if (!app || wasInGame.current === inGame) return;
    wasInGame.current = inGame;
    app.scrollTo({ top: inGame ? 0 : shellScroll.current });
  }, [inGame]);

  const me = view.players.find((p) => p.id === view.self);
  const retainedTable = GAME_KINDS.find((kind) =>
    view.tables?.[kind]?.members.includes(view.self),
  );
  const connected = view.status === 'connected';
  // Old-style invites (from older clients) still get the invitations list;
  // tables call friends with a banner and show themselves in the scene.
  const pendingInvites = connected
    ? view.invites.filter(
        (r) =>
          r.status === 'waiting' &&
          !r.table &&
          !r.fill &&
          (r.from === view.self || r.invited.includes(view.self)),
      ).length
    : 0;
  // A friend called me to a table I have not walked up to yet.
  const calledTo = connected
    ? (view.invites.find(
        (r) =>
          r.status === 'waiting' &&
          (!!r.table || !!r.fill) &&
          r.invited.includes(view.self) &&
          !r.accepted.includes(view.self) &&
          !r.declined.includes(view.self),
      ) ?? null)
    : null;
  const seat = connected ? mySeat(view) : null;

  // Contract #1: tell the server where I am whenever the tab changes.
  const sendArea = useCallback(
    (next: Tab, at?: { x: number; y: number }) => {
      if (room.snapshot().status !== 'connected') return;
      if (next === 'village') {
        const p = villageToNetwork(villagePosition.current ?? VILLAGE_START);
        void room.area('village', p.x, p.y);
      } else if (at) void room.area(TAB_AREA[next], at.x, at.y);
      else void room.area(TAB_AREA[next]);
    },
    [room],
  );
  // Also (re)send after (re)connecting, so presence matches the current screen.
  useEffect(() => {
    if (connected) sendArea(tabRef.current);
  }, [connected, view.code, sendArea]);

  const changeSave = (s: LoungeSave) => {
    setSave(s);
    if (connected && s.actor === me?.actor)
      void room.action({ kind: 'look', look: s.looks[s.actor] });
  };
  const move = useCallback(
    (x: number, y: number) => {
      if (room.snapshot().status === 'connected')
        void room.action({ kind: 'move', x, y });
      else {
        const key =
          tabRef.current === 'casino'
            ? 'casino'
            : tabRef.current === 'lounge'
              ? 'lounge'
              : 'village';
        setLocalPos((all) => ({
          ...all,
          [key]: {
            x: Math.max(15, Math.min(85, x)),
            y: Math.max(42, Math.min(88, y)),
          },
        }));
      }
    },
    [room],
  );
  const enter = (
    destination: VillageDestination | 'village' = 'village',
    place?: VillagePlace,
    /** Where to stand inside a hall / casino (e.g. beside a table). */
    at?: { x: number; y: number },
    then?: () => void,
  ) => {
    const from = visiting !== null ? 'village' : tab;
    const go = () => {
      setVisiting(null);
      setGameScreen(null);
      if (place) enteredPlace.current = place;
      if (destination === 'village' && from !== 'village') {
        const position = enteredPlace.current
          ? villageReturnPoint(enteredPlace.current)
          : villagePosition.current;
        setVillageSpawn(position);
        villagePosition.current = position;
        enteredPlace.current = null;
      }
      if (destination === 'village' && from === 'wardrobe')
        setSave((s) => ({ ...s, visits: s.visits + 1 }));
      // Walking in from the village: at the door. Back from the wardrobe: by the bed.
      if (destination === 'bedroom')
        setRoomSpawn(from === 'wardrobe' ? 'bed' : 'door');
      if (destination === 'wardrobe')
        setWardrobeFrom(from === 'bedroom' ? 'bedroom' : 'village');
      setModal(null);
      setSheet(null);
      setTab(destination);
      if (destination !== from || visiting !== null) sendArea(destination, at);
      else if (at) move(at.x, at.y);
      then?.();
    };
    if (destination === from) go();
    else {
      preloadTab(destination, save);
      playFade(go);
    }
  };
  /** 나가기 from an interior: the wardrobe opened from my room goes back there. */
  const leaveInterior = () =>
    enter(tab === 'wardrobe' && wardrobeFrom === 'bedroom' ? 'bedroom' : 'village');
  const backTo =
    tab === 'wardrobe' && wardrobeFrom === 'bedroom' ? NAMES.home : NAMES.village;
  // Esc in the hall, the casino, the wardrobe or my room = 나가기.
  const leaveRef = useRef(leaveInterior);
  useLayoutEffect(() => {
    leaveRef.current = leaveInterior;
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (tabRef.current === 'village' || document.querySelector('dialog[open], .l-coach'))
        return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      // My room handles its own keys (꾸미기 uses Esc to deselect).
      if (t?.closest('.b3-scene') || document.querySelector('.b3-room[data-editing]')) return;
      if (document.querySelector('.l-in-game, [data-testid=friend-visit]')) return;
      leaveRef.current();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const moveInVillage = useCallback(
    (x: number, y: number) => {
      villagePosition.current = villageFromNetwork({ x, y });
      move(x, y);
    },
    [move],
  );
  const greet = async (value: ReactionId) => {
    const scope =
      visiting !== null || tab === 'bedroom'
        ? 'home'
        : tab === 'casino'
          ? 'casino'
          : tab === 'village'
            ? 'village'
            : 'lounge';
    if (connected) {
      if (!(await room.action({ kind: 'reaction', id: value, scope })))
        return false;
    } else {
      const at = Date.now();
      setLocalReaction({ id: value, scope, at, expiresAt: at + REACTION_TTL });
    }
    playCue('sticker');
    return true;
  };
  // "범타듀의 하루": fruit, friend visits and the mailbox.
  const pickFruit = async (tree: string) => {
    const before = room.snapshot().life?.me.bag.fruit ?? 0;
    if (await room.life({ kind: 'pick', tree })) {
      const after = room.snapshot().life?.me.bag.fruit ?? before;
      notify(`과일을 ${Math.max(1, after - before)}개 땄어요! 가방에 담았어요.`);
      loungeAudio.chime('harvest');
    }
  };
  /* ---------------------------------------------------------- life expansion */
  const lifeRun = async (
    action: Parameters<typeof room.life>[0],
    done: string,
    sfx?: Parameters<typeof lifeSfx>[0],
  ) => {
    const ok = await room.life(action);
    if (ok) {
      if (done) notify(done);
      if (sfx) lifeSfx(sfx);
    }
    return ok;
  };
  const openBook = (bookTabNext: BookTab, museum = false) => {
    setBookTab(bookTabNext);
    setAtMuseum(museum);
    setModal('collection');
  };
  const openShop = (next: ShopTab = 'seeds') => {
    setShopTab(next);
    setModal('shop');
  };
  const giftItem = (item: string) => {
    setMailTo(undefined);
    setMailGift(item);
    setModal('mail');
  };
  const giftTo = (actor: number) => {
    setMailGift(undefined);
    setMailTo(actor);
    setModal('mail');
  };
  /** E at my farm: the selected hotbar seed / fertilizer / can acts at once. */
  const farmAct = () => {
    const life = room.snapshot().life;
    const now = Date.now() + room.snapshot().clockOffset;
    const quick = life
      ? farmToolAction(life.me.farm, life.me, hotbar.tool, now, life.calendar?.season ?? 'spring', !!life.flags?.includes('greenhouse'))
      : null;
    if (!quick) {
      setModal('farm');
      return;
    }
    if (quick.kind === 'water')
      void lifeRun({ kind: 'water', plot: -1 }, `${quick.n}칸에 물을 줬어요. 더 빨리 자라요!`).then((ok) => ok && loungeAudio.chime('water'));
    else if (quick.kind === 'plant') {
      const crop = hotbar.tool.slice(5) as Crop;
      void lifeRun({ kind: 'plant', plot: -1, crop }, `${itemName(crop)} ${quick.n}칸을 심었어요.`).then(
        (ok) => ok && loungeAudio.chime('plant'),
      );
    } else
      void lifeRun(
        { kind: 'fertilize', plot: -1, item: hotbar.tool },
        `${quick.n}칸에 ${itemName(hotbar.tool)}를 줬어요.`,
        'pickup',
      );
  };
  const startFishing = (spot: Spot) => {
    setModal(null);
    setFishing({ spot, phase: 'casting' });
  };
  const fishPhase = useCallback((phase: FishingPhase | null) => {
    setFishing((f) => (f && phase ? (f.phase === phase ? f : { ...f, phase }) : f));
  }, []);
  const gather = async (spot: string, mode: 'forage' | 'bug', item: string) => {
    const before = room.snapshot().life?.me.inv?.[item] ?? 0;
    const ok = await room.life({ kind: mode === 'bug' ? 'catch' : 'forage', spot });
    if (!ok) return;
    const got = Math.max(1, (room.snapshot().life?.me.inv?.[item] ?? before + 1) - before);
    notify(`${josa(itemName(item), '을/를')} ${got > 1 ? `${got}개 ` : ''}${mode === 'bug' ? '잡았어요' : '주웠어요'}! 가방에 담았어요.`);
    lifeSfx(mode === 'bug' ? 'catch' : 'pickup');
  };
  const waterFriend = (actor: number) =>
    void lifeRun(
      { kind: 'waterFriend', owner: actor, plot: -1 },
      `${ACTORS[actor]}의 밭에 물을 줬어요. 추억이 쌓였어요!`,
    ).then((ok) => ok && loungeAudio.chime('water'));
  const wish = async () => {
    const before = room.snapshot().wallet.balance;
    if (await room.life({ kind: 'wish' })) {
      const got = room.snapshot().wallet.balance - before;
      notify(`분수에 소원을 빌었어요${got > 0 ? ` · ${formatBeom(got)}이 반짝!` : ''}`);
      lifeSfx('donate');
    }
  };
  const talkTo = (actor: number) => {
    const req = room.snapshot().life?.me.requests?.find((r) => r.from === actor && !r.done);
    if (!req) return;
    setTimeout(() => {
      setRequestFrom(actor);
      setModal('lifeRequest');
    }, 700);
  };
  /** A second press on a selected hotbar dish eats it. */
  const eatFromSlot = (ref: string) => {
    const dish = DISH_BY_ID[ref];
    if (!dish?.buff) return;
    void lifeRun({ kind: 'eat', item: ref }, `${josa(dish.name, '을/를')} 먹었어요. 오늘은 ${BUFF_INFO[dish.buff].name}!`, 'eat');
  };
  /** 요리·만들기 happens at a table in my room: walk there (going home first). */
  const openKitchen = () => {
    setModal(null);
    const go = () => {
      window.dispatchEvent(new CustomEvent('bumtadew:room-go', { detail: 'cook' }));
      notify('책상으로 걸어가요. 도착하면 E로 요리하고 만들어요.', 'info');
    };
    if (tabRef.current === 'bedroom' && visiting === null) go();
    else enter('bedroom', VILLAGE_PLACES.find((p) => p.id === `home-${save.actor}`), undefined, () => setTimeout(go, 900));
  };
  const walkTo = (point: VillagePoint) => {
    setModal(null);
    const go = () => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: point }));
    if (tabRef.current === 'village' && visiting === null) go();
    else enter('village', undefined, undefined, () => setTimeout(go, 600));
  };
  const lifeEvents = useLifeEvents({
    view,
    room,
    push: pushBanner,
    notify,
    selfActor: save.actor,
    onAchievements: () => openBook('achievements'),
    onGiftTo: giftTo,
  });
  // Friends' rooms are shared: everyone in 'home' + owner sees each other.
  const visitHouse = (actor: number) => {
    if (actor === save.actor) {
      setVisiting(null);
      enter('bedroom', VILLAGE_PLACES.find((p) => p.id === `home-${actor}`));
      return;
    }
    if (view.life?.rooms?.[actor]?.access === 'closed') {
      notify(`${josa(ACTORS[actor] + '의 방', '은/는')} 지금 방문을 닫아 두었어요.`, 'info');
      return;
    }
    setModal(null);
    if (connected) void prefetchVisit(actor).catch(() => {});
    playFade(() => {
      setVisiting(actor);
      if (connected)
        void room
          .area('home', AREA_DEFAULTS.home.x, AREA_DEFAULTS.home.y, actor)
          .then((ok) => {
            if (!ok) leaveVisit(actor);
          });
    });
  };
  const leaveVisit = (owner = visiting) => {
    playFade(() => {
      setVisiting(null);
      // Back out through their front door.
      const place = VILLAGE_PLACES.find((p) => p.id === `home-${owner}`);
      const spot = place ? villageReturnPoint(place) : villagePosition.current;
      if (spot) {
        villagePosition.current = spot;
        setVillageSpawn(spot);
      }
      if (tabRef.current !== 'village') setTab('village');
      sendArea('village');
    });
  };
  // Walking up to a door: load what is behind it (chunk, art, a friend's room).
  const preloadPlace = (place: VillagePlace | null) => {
    if (!place) return;
    if (place.kind === 'home' && place.actor !== save.actor) {
      if (place.actor !== undefined && room.snapshot().status === 'connected')
        void prefetchVisit(place.actor).catch(() => {});
      return;
    }
    preloadTab(place.destination, save);
  };
  // Who is inside each building, for the door prompt ("회관 · 안에 2명").
  const areaCounts: Record<string, number> = {};
  if (connected)
    for (const p of view.players) {
      if (p.id === view.self) continue;
      const id =
        p.area === 'lounge'
          ? 'hall'
          : p.area === 'casino'
            ? 'casino'
            : p.area === 'wardrobe'
              ? 'wardrobe'
              : p.area === 'home'
                ? `home-${p.home ?? p.actor}`
                : null;
      if (id) areaCounts[id] = (areaCounts[id] ?? 0) + 1;
    }
  // Someone walked into my room / wrote in my guestbook: tell me.
  const roomGuests = useRef<Set<string> | null>(null);
  useEffect(() => {
    const here = view.players.filter(
      (p) => p.id !== view.self && p.area === 'home' && p.home === save.actor,
    );
    const known = roomGuests.current;
    if (known)
      for (const p of here)
        if (!known.has(p.id))
          pushBanner('guest', `${josa(ACTORS[p.actor], '이/가')} 내 방에 놀러 왔어요.`, {
            key: 'guest-' + p.id,
            action:
              tabRef.current === 'bedroom'
                ? undefined
                : { label: '가기', run: () => flowRef.current.enterRoom() },
          });
    roomGuests.current = new Set(here.map((p) => p.id));
  }, [view.players, view.self, save.actor, pushBanner]);
  const guestbookUnread = view.life?.me.guestbookUnread ?? 0;
  const lastGuestbook = useRef<number | null>(null);
  useEffect(() => {
    if (lastGuestbook.current !== null && guestbookUnread > lastGuestbook.current)
      pushBanner('guest', `방명록에 새 글이 ${guestbookUnread}개 있어요.`, {
        key: 'guestbook',
        action:
          tabRef.current === 'bedroom'
            ? undefined
            : { label: '가기', run: () => flowRef.current.enterRoom() },
      });
    lastGuestbook.current = guestbookUnread;
  }, [guestbookUnread, pushBanner]);
  // Visitors refetch my room shortly after I save a decoration change.
  const decoratedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomDecorated = () => {
    if (decoratedTimer.current) clearTimeout(decoratedTimer.current);
    decoratedTimer.current = setTimeout(() => {
      if (room.snapshot().status === 'connected') void room.life({ kind: 'room' });
    }, 2500);
  };
  const openMail = (to?: number) => {
    setMailTo(to);
    setModal('mail');
  };
  // Opens a table screen (banner [가기], retained-table button).
  const openGame = (kind: GameKind) => {
    setModal(null);
    setGameScreen(kind);
  };
  // Closing a table started in the hall/casino puts me beside that table there.
  const closeGame = () => {
    const kind = gameScreen;
    setGameScreen(null);
    const area = tab === 'lounge' ? 'lounge' : tab === 'casino' ? 'casino' : null;
    if (kind && area && TABLE_AREA[kind] === area) {
      const side = sceneTableSide(area, kind);
      move(side.x, side.y);
    }
  };
  /**
   * Go to a game's table (banner [가기], the old "게임 초대" menu, 다시 초대하기):
   * into its hall / casino with the iris transition, beside the table, with
   * the table's sheet open (setup at an empty table, join at a forming one).
   */
  const goToTable = (game: GameKind, call?: string[]) => {
    const area = TABLE_AREA[game];
    const side = sceneTableSide(area, game);
    const state = tableState(room.snapshot(), game);
    const kind = tableAction(state);
    setModal(null);
    const open = () => {
      if (kind === 'watch' || kind === 'resume') setGameScreen(game);
      else if (kind !== 'stand') setSheet({ game, call });
    };
    if (connected && seat && seat.game !== game) {
      // Going to another table stands me up from the one I sit at.
      void room.action({ kind: 'cancel', id: seat.id });
      notify(`${GAME_INFO[seat.game].name} 테이블에서 일어났어요.`, 'info');
    }
    if (tab === area && visiting === null) {
      setGameScreen(null);
      move(side.x, side.y);
      open();
      return;
    }
    enter(
      area,
      VILLAGE_PLACES.find((p) => p.id === (area === 'lounge' ? 'hall' : 'casino')),
      side,
      open,
    );
  };
  /** Beside a table after standing up from a forming seat. */
  const standBeside = (game: GameKind) => {
    const area = TABLE_AREA[game];
    if (tabRef.current !== area) return;
    const side = sceneTableSide(area, game);
    move(side.x, side.y);
  };
  /** The action button / E next to a table in the scene. */
  const tableAct = (game: GameKind) => {
    const state = tableState(room.snapshot(), game);
    const kind = tableAction(state);
    if (kind === 'watch' || kind === 'resume') {
      setSheet(null);
      playFade(() => {
        setModal(null);
        setGameScreen(game);
      });
    } else if (kind === 'stand') {
      if (state.invite)
        void room
          .action({ kind: 'cancel', id: state.invite.id })
          .then((ok) => ok && standBeside(game));
    } else
      setSheet((current) => ({
        game,
        call: current?.game === game ? current.call : undefined,
      }));
  };
  // Sitting at a forming table puts me on a seat around it.
  const seatIndex = seat ? seat.accepted.indexOf(view.self) : -1,
    seatGame = seat?.game ?? null,
    seatRequired = seat?.required ?? 0,
    seatId = seat?.id ?? '';
  useEffect(() => {
    if (!seatId || !seatGame || seatIndex < 0) return;
    const area = TABLE_AREA[seatGame];
    if (tabRef.current !== area) return;
    const p = sceneSeatPoint(area, seatGame, seatIndex, seatRequired);
    move(p.x, p.y);
  }, [seatId, seatGame, seatIndex, seatRequired, move]);
  useLayoutEffect(() => {
    flowRef.current = {
      openMail: () => openMail(),
      enterRoom: () => {
        if (visiting !== null) leaveVisit();
        if (tabRef.current !== 'bedroom')
          enter('bedroom', VILLAGE_PLACES.find((p) => p.id === `home-${save.actor}`));
      },
      openGame,
      openInvites: () => setModal('invitations'),
      goToTable: (kind) => goToTable(kind),
    };
  });
  // The table came on screen (e.g. after the start transition): its turn
  // banner is no longer news.
  useEffect(() => {
    if (inGame && gameScreen) dropBanner('turn-' + gameScreen);
  }, [inGame, gameScreen, dropBanner]);
  // "내 차례": a banner with [가기] when the table is not on screen.
  const turnsRef = useRef(new Set<GameKind>());
  useEffect(() => {
    for (const kind of GAME_KINDS) {
      const seat = view.seats[kind].indexOf(view.self);
      const now = connected && seat >= 0 && myTurn(kind, view, seat);
      const was = turnsRef.current.has(kind);
      if (now && !was) {
        turnsRef.current.add(kind);
        if (!(inGame && gameScreen === kind)) {
          const text = `${GAME_INFO[kind].name} · 내 차례예요.`;
          attention('turn', text);
          pushBanner('turn', text, {
            key: 'turn-' + kind,
            action: { label: '가기', run: () => flowRef.current.openGame(kind) },
          });
        }
      } else if (!now && was) {
        turnsRef.current.delete(kind);
        dropBanner('turn-' + kind);
      }
    }
  });
  // The day starts in my room: one line about today's grant / new mail.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current || !connected) return;
    const timer = setTimeout(() => {
      if (greeted.current) return;
      greeted.current = true;
      const v = room.snapshot();
      const daily = dailyOf(v),
        letters = v.life?.me.mailUnread ?? 0;
      const parts: string[] = [];
      if (daily?.available) parts.push(`오늘의 범 ${josa(formatBeom(daily.amount), '이/가')} 기다려요`);
      if (letters) parts.push(`새 편지 ${letters}통`);
      if (daily?.available)
        pushBanner('daily', parts.join(' · '), {
          key: 'daily',
          action: {
            label: '받기',
            run: () =>
              void room.daily().then((ok) => {
                if (ok)
                  notify(`오늘의 범 ${josa(formatBeom(daily.amount), '을/를')} 받았어요.`);
              }),
          },
        });
      else if (letters)
        pushBanner('mail', parts.join(' · ') + '이 와 있어요.', {
          key: 'mail',
          action: { label: '보기', run: () => flowRef.current.openMail() },
        });
    }, 900);
    return () => clearTimeout(timer);
  }, [connected, room, pushBanner, notify]);
  // Desktop keys: I 가방, K 도감, L 추억 앨범, 1–9 핫바 (village).
  const lifeKeys = useRef({ open: (_m: ModalName) => {} });
  useLayoutEffect(() => {
    lifeKeys.current = {
      open: (m) => {
        setAtMuseum(false);
        setModal(m);
      },
    };
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (document.querySelector('dialog[open], .l-coach, .l-in-game, [data-testid=fishing]')) return;
      if (document.querySelector('.b3-room[data-editing]')) return;
      const m: ModalName | null = e.code === 'KeyI' ? 'bag' : e.code === 'KeyK' ? 'collection' : e.code === 'KeyL' ? 'memories' : null;
      if (!m) return;
      e.preventDefault();
      lifeKeys.current.open(m);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useHotbarKeys(hotbar, tab === 'village' && visiting === null && !inGame && !fishing, eatFromSlot);
  // "어제 마을 소식" once on the first login of the day.
  const digestDue = lifeEvents.digestDue;
  const markDigest = useRef(lifeEvents.markDigest);
  useLayoutEffect(() => {
    markDigest.current = lifeEvents.markDigest;
  });
  useEffect(() => {
    if (!digestDue || modal || coach || !connected || inGame) return;
    const timer = setTimeout(() => {
      markDigest.current();
      setModal('digest');
    }, 1800);
    return () => clearTimeout(timer);
  }, [digestDue, modal, coach, connected, inGame]);

  // Life loop entries for the simple / fallback village (no 3D scene).
  const simpleLife = {
    life: view.life,
    clockOffset: view.clockOffset,
    onFarm: () => setModal('farm'),
    onShop: () => setModal('shop'),
    onBag: () => setModal('bag'),
    onMail: () => openMail(),
    onPick: (tree: string) => void pickFruit(tree),
    onVisit: visitHouse,
  };
  /**
   * "게임 초대" (menu, header, play hub, 다시 초대하기): games start at a table,
   * so this picks a game and walks me to its table. Only "빈자리에 친구 초대"
   * (a short retained table I keep a seat at) still opens the invite dialog.
   */
  const requestGame = (kind: GameKind | null, preselect?: string[]) => {
    if (!connected) {
      setModal('friends');
      return;
    }
    const retained = kind ? view.tables?.[kind] : undefined;
    if (
      kind &&
      retained?.members.includes(view.self) &&
      retained.members.length < retained.required
    ) {
      setRequest({ kind, preselect });
      setModal('request');
    } else if (kind) goToTable(kind, preselect);
    else {
      setRequest({ kind: null });
      setModal('request');
    }
  };
  const openTable = (kind: GameKind) => {
    const flow = gameFlow(view, kind);
    if (flow.canOpen && (flow.ownTable || flow.ownSeat)) {
      setModal(null);
      setGameScreen(kind);
    } else goToTable(kind);
  };

  const commitment = activeCommitment(view);
  const consequences = [
    ...(commitment.kind ? [GAME_COPY[commitment.kind].leaveActive] : []),
    ...(commitment.invite
      ? [`수락한 ${GAME_INFO[commitment.invite.game].name} 초대가 취소돼요.`]
      : []),
  ];
  const guarded = (what: Confirm, run: () => void) => {
    if (consequences.length || what === 'reset') {
      if (what === 'reset') setModal(null);
      setConfirm(what);
    } else run();
  };
  const leaveRoom = async () => {
    if (!(await room.leave())) {
      notify('방에서 나가지 못했어요. 다시 시도해 주세요.', 'error');
      return false;
    }
    setModal(null);
    notify('방에서 나왔어요. 모두의 마을로 다시 들어갈 수 있어요.', 'info');
    return true;
  };
  const logout = async () => {
    try {
      if (!(await cloudSave.flush())) {
        notify(
          '저장을 마치지 못했어요. 다른 창의 변경 사항을 먼저 확인해 주세요.',
          'error',
        );
        return false;
      }
      if (!(await room.leave())) {
        notify(
          '마을에서 나가지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.',
          'error',
        );
        return false;
      }
      await accountLogout(account.id);
      onLogout();
      return true;
    } catch (e) {
      notify(friendlyError(e, '로그아웃하지 못했어요.'), 'error');
      return false;
    }
  };
  const logoutAll = async () => {
    try {
      if (!(await cloudSave.flush())) {
        notify(
          '저장을 마치지 못했어요. 다른 창의 변경 사항을 먼저 확인해 주세요.',
          'error',
        );
        return false;
      }
      await room.leave();
      await accountLogoutAll(account.id);
      onLogout();
      return true;
    } catch (e) {
      notify(friendlyError(e, '로그아웃하지 못했어요.'), 'error');
      return false;
    }
  };
  const reset = () => {
    // Only the outfit resets; staying in the room means no game is forfeited.
    const next = {
      ...accountSave(freshLounge(), account.actor),
      bedroom: save.bedroom,
    };
    setSave(next);
    if (connected)
      void room.action({ kind: 'look', look: next.looks[next.actor] });
    setModal(null);
    notify('코디를 초기화했어요.');
    return true;
  };

  const self = connected ? view.self : 'local';
  const players: LoungePlayer[] = connected
    ? view.players
    : [
        {
          id: 'local',
          actor: save.actor,
          look: save.looks[save.actor],
          ...localPos[
            tab === 'casino' ? 'casino' : tab === 'lounge' ? 'lounge' : 'village'
          ],
          emote: '',
          emoteAt: 0,
          balance: 0,
          area: (tab === 'casino'
            ? 'casino'
            : tab === 'village'
              ? 'village'
              : 'lounge') as LoungePlayer['area'],
          reaction: localReaction,
        },
      ];

  // Chat follows my server-side area (contract #1): village / hall / casino.
  const myArea = (me?.area as string | undefined) ?? TAB_AREA[tab];
  const chatTitle =
    myArea === 'home'
      ? '이 방 수다'
      : myArea === 'village'
      ? NAMES.chatVillage
      : myArea === 'casino'
        ? NAMES.chatCasino
        : NAMES.chatHall;
  // The table sheet over the hall / casino: my seat (seated) wins; otherwise
  // the table I walked up to (setup at an empty one, join at a forming one).
  const interior = tab === 'lounge' || tab === 'casino' ? tab : null;
  let tableSheet: { game: GameKind; mode: SheetMode; call?: string[] } | null =
    null;
  if (interior && !inGame && visiting === null && connected) {
    if (seat && TABLE_AREA[seat.game] === interior)
      tableSheet = { game: seat.game, mode: 'seated' };
    else if (sheet && TABLE_AREA[sheet.game] === interior) {
      const st = tableState(view, sheet.game);
      const mode: SheetMode | null =
        st.phase === 'empty'
          ? 'setup'
          : (st.phase === 'forming' && !st.seated) ||
              (st.phase === 'retained' && st.fill)
            ? 'join'
            : null;
      if (mode) tableSheet = { game: sheet.game, mode, call: sheet.call };
    }
  }
  return (
    <main
      ref={appRef}
      className={
        inGame
          ? 'l-app l-in-game'
          : `l-app ${tab === 'village' && visiting === null ? 'l-immersive' : 'l-interior'}`
      }
      data-space={inGame ? 'game' : visiting === null ? tab : 'visit'}
      onScroll={
        inGame
          ? undefined
          : (e) => {
              shellScroll.current = e.currentTarget.scrollTop;
            }
      }
    >
      {inGame && gameScreen && (
        <GameScreen
          key={gameScreen + ':' + (view[gameScreen]?.id ?? 'waiting')}
          kind={gameScreen}
          room={room}
          view={view}
          onBack={closeGame}
          place={TABLE_AREA[gameScreen] === 'casino' ? NAMES.casino : NAMES.hall}
          onRequest={requestGame}
          reactionsHidden={reactionsHidden}
          onReactionsHidden={setReactionsHidden}
          notify={notify}
        />
      )}
      <WorldHeader
        tab={tab}
        save={save}
        room={room}
        view={view}
        notify={notify}
        onBrand={() => (tab === 'village' ? setModal('menu') : leaveInterior())}
        backTo={backTo}
        onPresence={() => setModal('friends')}
        onInvite={() => requestGame(null)}
        onWallet={() => setModal('wallet')}
        onAccount={() => setModal('account')}
        onMenu={() => setModal('menu')}
        onMail={() => openMail()}
        onBag={() => setModal('bag')}
      />
      <SaveStatus
        status={cloudSave.status}
        onRetry={() => void cloudSave.flush()}
      />
      <div className="l-world-alerts">
        {(view.status === 'error' || view.lost) && (
          <aside className="l-connection-alert" role="alert">
            <span>
              <strong>마을과 연결이 끊겼어요.</strong>
              <small>{view.error || '잠시 뒤 다시 들어가 주세요.'}</small>
            </span>
            <button
              className="l-primary"
              onClick={() => void room.rejoin(myLook)}
            >
              <RotateCcw size={15} /> 다시 들어가기
            </button>
          </aside>
        )}
        {retainedTable && connected && (
          <aside
            className="l-retained-table"
            aria-label="유지 중인 게임 테이블"
          >
            <span>
              <strong>
                {GAME_INFO[retainedTable].name} 테이블에 자리가 있어요
              </strong>
              <small>둘러봐도 자리는 유지돼요.</small>
            </span>
            <button
              className="l-primary"
              onClick={() => openGame(retainedTable)}
            >
              게임으로 돌아가기 <ArrowRight size={15} />
            </button>
          </aside>
        )}
        {cloudSave.blocked && (
          <div className="l-save-alert" role="alert">
            <p>{cloudSave.blocked}</p>
            <button onClick={() => location.reload()}>새로고침</button>
          </div>
        )}
        {cloudSave.conflict && (
          <div className="l-save-alert" role="alert">
            <p>다른 창에서 저장 내용이 바뀌었어요. 어떤 내용을 간직할까요?</p>
            <button onClick={() => cloudSave.resolve(false)}>
              서버의 저장 불러오기
            </button>
            <button onClick={() => cloudSave.resolve(true)}>
              지금 내용으로 덮어쓰기
            </button>
          </div>
        )}
        {cloudSave.draft && (
          <div className="l-save-alert">
            <p>이 기기에 아직 저장하지 못한 코디나 방 꾸미기가 있어요.</p>
            <button onClick={cloudSave.restoreDraft}>저장 내용 복구하기</button>
            <button onClick={cloudSave.dismissDraft}>서버의 저장 유지</button>
          </div>
        )}
        {calledTo && !inGame && !(tab === TABLE_AREA[calledTo.game] && visiting === null) && (
          // Called to a table: the banner said so once; this line keeps it in view.
          <aside className="l-retained-table l-invite-pill" aria-label="친구가 부른 테이블" data-testid="called-pill">
            <span>
              <strong>
                {josa(nameOf(calledTo.from, view.players), '이/가')}{' '}
                {TABLE_PLACE[TABLE_AREA[calledTo.game]]} {GAME_INFO[calledTo.game].name} 테이블로 불렀어요
              </strong>
              <small>가면 테이블 옆에서 바로 앉을 수 있어요.</small>
            </span>
            <button className="l-primary" onClick={() => goToTable(calledTo.game)}>
              가기 <ArrowRight size={15} />
            </button>
          </aside>
        )}
        {tab !== 'lounge' && tab !== 'casino' && pendingInvites > 0 && (
          // Arrivals come as a banner; this line only keeps the status in view.
          <aside className="l-retained-table l-invite-pill" aria-label="진행 중인 초대">
            <span>
              <strong>진행 중인 초대 {pendingInvites}건</strong>
              <small>친구들의 답을 기다리고 있어요.</small>
            </span>
            <button className="l-secondary" onClick={() => setModal('invitations')}>
              보기 <ArrowRight size={15} />
            </button>
          </aside>
        )}
      </div>
      {!inGame && (tab === 'village' || tab === 'bedroom') && connected && view.life?.calendar && (
        <div className="l-life-hud" data-place={tab === 'village' && visiting === null ? 'village' : 'interior'}>
          <CalendarChip life={view.life} clockOffset={view.clockOffset} onOpen={() => setModal('digest')} />
        </div>
      )}
      {!inGame && tab === 'village' && visiting === null && !settings.simpleGraphics && connected && view.life && (
        <div className="l-village-hotbar">
          <Hotbar hotbar={hotbar} life={view.life} onUse={eatFromSlot} />
        </div>
      )}
      {fishing && tab === 'village' && visiting === null && !inGame && (
        <FishingOverlay
          room={room}
          view={view}
          spot={fishing.spot}
          notify={notify}
          onClose={() => setFishing(null)}
          onPhase={fishPhase}
        />
      )}
      {lifeEvents.celebration && (
        <Celebration name={lifeEvents.celebration.name} text={lifeEvents.celebration.text} />
      )}
      {visiting !== null ? (
        <FriendVisitScreen
          room={room}
          view={view}
          save={save}
          owner={visiting}
          notify={notify}
          onBack={() => leaveVisit()}
          onChat={() => setModal('chat')}
          stickers={
            <ReactionDock
              players={players}
              self={self}
              scope="home"
              connected={connected}
              hidden={reactionsHidden}
              onHidden={setReactionsHidden}
              onSend={greet}
            />
          }
          onMail={(actor) => openMail(actor)}
        />
      ) : tab === 'village' ? (
        <section className="l-village">
          <div className="l-village-content">
            {settings.simpleGraphics ? (
              <VillageSimple
                actor={save.actor}
                players={players}
                self={self}
                onEnter={enter}
                onChat={() => setModal('chat')}
                {...simpleLife}
              />
            ) : (
              <div className="l-village-world">
                <ScreenBoundary
                  name="village"
                  fallback={
                    <VillageSimple
                      actor={save.actor}
                      players={players}
                      self={self}
                      onEnter={enter}
                      onChat={() => setModal('chat')}
                      {...simpleLife}
                    />
                  }
                >
                  <Suspense
                    fallback={<Loading text="마을에 햇살을 들이는 중…" />}
                  >
                    <Village3D
                      save={save}
                      players={players}
                      self={self}
                      initialPosition={villageSpawn}
                      onMove={moveInVillage}
                      onEnter={enter}
                      onFriends={() => setModal('friends')}
                      onRequest={() => requestGame(null)}
                      chat={view.chat.filter(
                        (line) => !line.scope || line.scope === 'village',
                      )}
                      life={view.life}
                      clockOffset={view.clockOffset}
                      dayNight={settings.dayNight}
                      onFarm={farmAct}
                      onShop={() => openShop('seeds')}
                      onMail={() => openMail()}
                      onPick={(tree) => void pickFruit(tree)}
                      onVisit={visitHouse}
                      areaCounts={areaCounts}
                      onNear={preloadPlace}
                      onFish={startFishing}
                      onSpawn={(spot, mode, item) => void gather(spot, mode, item)}
                      onMuseum={() => openBook('museum', true)}
                      onBoard={() => setModal('board')}
                      onWaterFriend={waterFriend}
                      onWish={() => void wish()}
                      onTalk={talkTo}
                      tool={hotbar.tool}
                      fishing={fishing}
                      seasonFx={settings.seasonFx}
                    />
                  </Suspense>
                </ScreenBoundary>
                <div className="l-world-social">
                  <button
                    className="l-world-chat-button"
                    aria-label={`${NAMES.chatVillage} 열기`}
                    onClick={() => setModal('chat')}
                  >
                    <MessageCircle size={19} />
                    <span>수다</span>
                  </button>
                  <button
                    className="l-world-chat-button"
                    aria-label="가방 열기"
                    onClick={() => setModal('bag')}
                    data-testid="dock-bag"
                  >
                    <Backpack size={19} />
                    <span>가방</span>
                  </button>
                  <ReactionDock
                    players={players}
                    self={self}
                    scope="village"
                    connected={connected}
                    hidden={reactionsHidden}
                    onHidden={setReactionsHidden}
                    onSend={greet}
                  />
                </div>
                <VillageHint paused={!!coach || !!modal} />
              </div>
            )}
          </div>
        </section>
      ) : tab === 'bedroom' ? (
        <ScreenBoundary
          name="bedroom"
          fallback={(retry, chunk) => (
            <ScreenError
              what={NAMES.home}
              retry={retry}
              chunk={chunk}
              onBack={() => enter('village')}
            />
          )}
        >
          <Suspense
            fallback={
              <Loading text={`${josa(NAMES.home, '을/를')} 여는 중…`} />
            }
          >
            <BedroomEditor
              key={roomSpawn}
              spawn={roomSpawn}
              onExit={() => enter('village')}
              onDress={() => enter('wardrobe')}
              onCook={() => setModal('kitchen')}
              onNearDoor={() => preloadTab('village')}
              save={save}
              onChange={setSave}
              notice={(s) => notify(s)}
              unlocks={[...(view.life?.me.unlocks ?? []), ...furnitureUnlocks(view.life?.me.furniture)]}
              presence={{
                players: connected ? view.players : [],
                self: view.self,
                chat: view.chat,
                onMove: (x, y) => {
                  if (connected) void room.action({ kind: 'move', x, y });
                },
              }}
              onDecorated={roomDecorated}
              onAccess={(access) => void room.life({ kind: 'room', access })}
              room={room}
              view={view}
              onChat={() => setModal('chat')}
              stickers={
                <ReactionDock
                  players={players}
                  self={self}
                  scope="home"
                  connected={connected}
                  hidden={reactionsHidden}
                  onHidden={setReactionsHidden}
                  onSend={greet}
                />
              }
            />
          </Suspense>
        </ScreenBoundary>
      ) : tab === 'wardrobe' ? (
        <ScreenBoundary
          name="wardrobe"
          fallback={(retry, chunk) => (
            <ScreenError
              what={NAMES.wardrobe}
              retry={retry}
              chunk={chunk}
              onBack={leaveInterior}
            />
          )}
        >
          <Suspense
            fallback={
              <Loading text={`${josa(NAMES.wardrobe, '을/를')} 여는 중…`} />
            }
          >
            <Wardrobe
              save={save}
              onChange={changeSave}
              locked
              entry={false}
              onEnter={leaveInterior}
              notice={(s) => notify(s)}
              unlocks={view.life?.me.unlocks}
            />
          </Suspense>
        </ScreenBoundary>
      ) : (
        <section className={'l-lounge' + (tab === 'casino' ? ' l-casino' : '')}>
          <div className="l-section-title">
            <div>
              <h1>{tab === 'casino' ? NAMES.casino : NAMES.hall}</h1>
              <p>
                {tab === 'casino'
                  ? '체스 · 텍사스 홀덤 · 블랙잭'
                  : '고스톱 · 섯다 · 친구들과 수다'}
              </p>
            </div>
            <button
              className="l-primary l-new-game"
              onClick={() => requestGame(null)}
            >
              <span aria-hidden="true">＋</span>게임 초대
            </button>
          </div>
          <div className="l-lounge-grid">
            <div className="l-room-wrap">
              <ScreenBoundary
                name="room-floor"
                fallback={(retry, chunk) => (
                  <ScreenError
                    what={tab === 'casino' ? NAMES.casino : NAMES.hall}
                    retry={retry}
                    chunk={chunk}
                  />
                )}
              >
                <Suspense fallback={<Loading text="들어가는 중…" />}>
                  <RoomFloor
                    players={players}
                    self={self}
                    onMove={move}
                    onTable={tableAct}
                    view={view}
                    area={tab === 'casino' ? 'casino' : 'lounge'}
                    seatedAt={tableSheet?.mode === 'seated' ? tableSheet.game : null}
                    sheetOpen={!!tableSheet}
                  />
                </Suspense>
              </ScreenBoundary>
              {tableSheet && (
                <TableSheet
                  key={tableSheet.game + ':' + tableSheet.mode}
                  room={room}
                  view={view}
                  game={tableSheet.game}
                  mode={tableSheet.mode}
                  preselect={tableSheet.call}
                  onClose={() => setSheet(null)}
                  onStand={() => {
                    setSheet(null);
                    standBeside(tableSheet.game);
                  }}
                  onSat={() => {
                    const game = tableSheet.game;
                    // Filling a retained table's empty seat: its screen shows the ready check.
                    if (tableState(room.snapshot(), game).phase === 'retained') {
                      setSheet(null);
                      setGameScreen(game);
                    }
                  }}
                />
              )}
              <ReactionDock
                players={players}
                self={self}
                scope={tab === 'casino' ? 'casino' : 'lounge'}
                connected={connected}
                hidden={reactionsHidden}
                onHidden={setReactionsHidden}
                onSend={greet}
              />
            </div>
            <aside className="l-lounge-sidebar">
              <div className="l-play-list">
                <h2>오늘의 한 판</h2>
                {(tab === 'casino'
                  ? (['poker', 'blackjack', 'chess'] as const)
                  : (['seotda', 'gostop'] as const)
                ).map((kind) => (
                  <button key={kind} onClick={() => openTable(kind)}>
                    <span
                      className={
                        'l-game-symbol' + (tab === 'casino' ? ' chess' : '')
                      }
                    >
                      {kind === 'gostop' || kind === 'seotda' ? (
                        // oxlint-disable-next-line nextjs/no-img-element -- Local decorative card art.
                        <img
                          src={
                            LOUNGE_ASSETS[
                              kind === 'gostop' ? 'm03-01' : 'm01-01'
                            ]
                          }
                          alt=""
                        />
                      ) : kind === 'chess' ? (
                        '♞'
                      ) : kind === 'poker' ? (
                        '♠'
                      ) : (
                        '♣'
                      )}
                    </span>
                    <span>
                      <strong>{GAME_INFO[kind].name}</strong>
                      <small>
                        {GAME_COPY[kind].players} · {GAME_COPY[kind].tagline}
                      </small>
                    </span>
                    <ArrowUpRight size={19} />
                  </button>
                ))}
              </div>
              <ChatPanel room={room} view={view} title={chatTitle} />
            </aside>
          </div>
          <button
            className="l-closet-invitation"
            onClick={() => enter('village')}
          >
            <Shirt size={29} />
            <span>
              <small>{NAMES.app}</small>
              <strong>다음에는 어디로 걸어갈까요?</strong>
            </span>
            <span>
              나가기
              <ArrowRight size={18} />
            </span>
          </button>
        </section>
      )}
      <footer className="l-footer">
        <span>{NAMES.app} · 일곱 친구가 사는 마을</span>
        <div>
          <button onClick={() => setModal('settings')}>
            <Settings size={12} /> 설정
          </button>
          <button onClick={() => setModal('credits')}>
            <Info size={12} /> 만든 이야기
          </button>
          <button onClick={() => guarded('reset', reset)}>코디 초기화</button>
        </div>
      </footer>
      {modal === 'chat' && (
        <Modal title={chatTitle} onClose={() => setModal(null)}>
          <ChatPanel
            room={room}
            view={view}
            title={chatTitle}
            className="l-village-chat"
          />
        </Modal>
      )}
      {modal === 'menu' && (
        <Modal title={NAMES.app} onClose={() => setModal(null)}>
          <div className="l-world-menu-summary">
            <AvatarView
              actor={save.actor}
              look={save.looks[save.actor]}
              portrait
            />
            <div>
              <strong>{ACTORS[save.actor]}</strong>
              <small>
                {account.username} · {cloudSave.status}
              </small>
            </div>
          </div>
          {!settings.simpleGraphics && (
            <p className="l-modal-intro">
              건물 이름을 누르면 문 앞까지 걸어가요.
            </p>
          )}
          <div className="l-world-menu-grid">
            <button onClick={() => setModal('friends')}>
              <Users size={20} />
              <span>마을 친구들</span>
            </button>
            <button onClick={() => setModal('bag')} data-testid="menu-bag">
              <Backpack size={20} />
              <span>가방 (I)</span>
            </button>
            <button onClick={() => openMail()}>
              <Mail size={20} />
              <span>
                우편함
                {unread > 0 ? ` (${unread})` : ''}
              </span>
            </button>
            <button onClick={() => setModal('shop')}>
              <Store size={20} />
              <span>범타듀 상점</span>
            </button>
            <button onClick={() => setModal('farm')} data-testid="menu-farm">
              <Sprout size={20} />
              <span>내 텃밭</span>
            </button>
            <button onClick={() => openBook('fish')} data-testid="menu-book">
              <BookOpen size={20} />
              <span>도감 · 박물관 (K)</span>
            </button>
            <button onClick={() => setModal('bonds')} data-testid="menu-bonds">
              <Heart size={20} />
              <span>친구 사이</span>
            </button>
            <button onClick={() => setModal('memories')} data-testid="menu-memories">
              <Sparkles size={20} />
              <span>추억 앨범 (L)</span>
            </button>
            <button onClick={() => walkTo(BOARD_FRONT)} data-testid="menu-board">
              <ClipboardList size={20} />
              <span>마을 게시판</span>
            </button>
            <button onClick={openKitchen} data-testid="menu-kitchen">
              <CookingPot size={20} />
              <span>요리·만들기</span>
            </button>
            <button onClick={() => setModal('digest')} data-testid="menu-digest">
              <Newspaper size={20} />
              <span>어제 마을 소식</span>
            </button>
            <button onClick={() => setModal('status')} data-testid="menu-status">
              <MessageSquareQuote size={20} />
              <span>오늘의 한마디</span>
            </button>
            <button onClick={() => requestGame(null)}>
              <Spade size={20} />
              <span>게임 초대</span>
            </button>
            <button onClick={() => void cloudSave.flush()}>
              <Check size={20} />
              <span>지금 저장</span>
            </button>
            <button onClick={() => setModal('account')}>
              <House size={20} />
              <span>내 계정</span>
            </button>
            <button onClick={() => setModal('settings')}>
              <Settings size={20} />
              <span>설정</span>
            </button>
            <button onClick={() => setModal('credits')}>
              <Info size={20} />
              <span>만든 이야기</span>
            </button>
          </div>
          <div className="l-world-menu-links">
            <button
              onClick={() => {
                setModal(null);
                setCoach(tab === 'bedroom' ? 'room' : 'village');
              }}
            >
              처음 안내 다시 보기
            </button>
            {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Static legacy game pages. */}
            <a href="./theater.html">
              우당탕 극장 <small>약 16MB</small> <ArrowUpRight size={12} />
            </a>
            {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Static legacy game pages. */}
            <a href="./island.html">
              지난 섬으로 <small>약 28MB</small> <ArrowUpRight size={12} />
            </a>
            <button className="danger" onClick={() => guarded('reset', reset)}>
              코디 초기화
            </button>
          </div>
        </Modal>
      )}
      {modal === 'account' && (
        <AccountModal
          account={account}
          save={save}
          setSave={setSave}
          saveStatus={cloudSave.status}
          flush={cloudSave.flush}
          notify={notify}
          onLogout={() => guarded('logout', () => void logout())}
          onLogoutAll={() => setConfirm('logoutAll')}
          onReset={() => guarded('reset', reset)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'friends' && (
        <FriendsModal
          room={room}
          view={view}
          look={myLook}
          onClose={() => setModal(null)}
          notify={notify}
          onLeaveRoom={() => guarded('leaveRoom', () => void leaveRoom())}
          onInvite={() => requestGame(null)}
          onVisit={visitHouse}
        />
      )}
      {modal === 'wallet' && (
        <WalletModal
          room={room}
          view={view}
          username={account.username}
          notify={notify}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'games' && (
        <Modal title="게임 현황" onClose={() => setModal(null)}>
          <LoungePlayHub
            view={view}
            onOpen={openTable}
            onRequest={requestGame}
            onWaiting={() => setModal('invitations')}
          />
        </Modal>
      )}
      {modal === 'invitations' && (
        <Modal title="초대와 참가 현황" onClose={() => setModal(null)}>
          <Invitations room={room} view={view} />
          <p className="l-help-text">
            필요한 친구가 모두 수락하면 함께 게임으로 이동해요.
          </p>
          <button className="l-secondary" onClick={() => setModal('games')}>
            게임 현황 보기
          </button>
        </Modal>
      )}
      {modal === 'request' && (
        <RequestGameModal
          room={room}
          view={view}
          initial={request.kind}
          preselect={request.preselect}
          onPick={(game) => goToTable(game)}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'farm' && (
        <FarmModal
          room={room}
          view={view}
          notify={notify}
          onClose={() => setModal(null)}
          onShop={() => setModal('shop')}
          onBag={() => setModal('bag')}
        />
      )}
      {modal === 'bag' && (
        <InventoryPanel
          room={room}
          view={view}
          notify={notify}
          onClose={() => setModal(null)}
          hotbar={hotbar}
          onGift={giftItem}
          onShop={() => openShop('seeds')}
        />
      )}
      {modal === 'shop' && (
        <ShopModal
          room={room}
          view={view}
          notify={notify}
          initialTab={shopTab}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'collection' && (
        <CollectionBook
          room={room}
          view={view}
          notify={notify}
          initialTab={bookTab}
          atMuseum={atMuseum}
          onGo={() => walkTo(MUSEUM_FRONT)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'kitchen' && (
        <KitchenPanel room={room} view={view} notify={notify} onClose={() => setModal(null)} />
      )}
      {modal === 'board' && (
        <BundleBoard room={room} view={view} notify={notify} onClose={() => setModal(null)} />
      )}
      {modal === 'bonds' && (
        <FriendsLife
          room={room}
          view={view}
          notify={notify}
          selfActor={save.actor}
          onGift={giftTo}
          onVisit={visitHouse}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'memories' && (
        <MemoriesAlbum view={view} selfActor={save.actor} onClose={() => setModal(null)} />
      )}
      {modal === 'digest' && <DigestCard view={view} onClose={() => setModal(null)} />}
      {modal === 'lifeRequest' && requestFrom !== null && (
        <RequestCard room={room} view={view} notify={notify} from={requestFrom} onClose={() => setModal(null)} />
      )}
      {modal === 'mail' && (
        <MailModal
          room={room}
          view={view}
          notify={notify}
          selfActor={save.actor}
          initialTo={mailTo}
          initialGift={mailGift}
          onClose={() => {
            setMailGift(undefined);
            setModal(null);
          }}
        />
      )}
      {modal === 'status' && (
        <StatusModal
          room={room}
          view={view}
          notify={notify}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'credits' && <CreditsModal onClose={() => setModal(null)} />}
      {confirm === 'leaveRoom' && (
        <ConfirmModal
          title="방에서 나갈까요?"
          body="지금 나가면 진행 중인 게임에 이런 일이 생겨요."
          consequences={consequences}
          confirmLabel="그래도 나가기"
          busyLabel="나가는 중…"
          cancelLabel="남아 있기"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={leaveRoom}
        />
      )}
      {confirm === 'logout' && (
        <ConfirmModal
          title="저장하고 로그아웃할까요?"
          body="로그아웃하면 마을에서도 나가요."
          consequences={consequences}
          confirmLabel="저장하고 로그아웃"
          busyLabel="저장 후 나가는 중…"
          cancelLabel="계속 놀기"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={logout}
        />
      )}
      {confirm === 'logoutAll' && (
        <ConfirmModal
          title="모든 기기에서 로그아웃할까요?"
          body="이 기기와 다른 기기의 로그인이 모두 해제돼요. 다시 들어오려면 비밀번호가 필요해요."
          consequences={consequences}
          confirmLabel="모든 기기에서 로그아웃"
          busyLabel="로그아웃하는 중…"
          cancelLabel="취소"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={logoutAll}
        />
      )}
      {confirm === 'reset' && (
        <ConfirmModal
          title="코디 초기화"
          body="내 코디와 보관한 의상이 처음 상태로 돌아가요. 범 지갑, 내 방 꾸미기, 게임 자리는 그대로예요."
          confirmLabel="코디 초기화"
          cancelLabel="계속 간직하기"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={reset}
        />
      )}
      {coach === 'village' && tab === 'village' && visiting === null && !modal && (
        <Onboarding onDone={() => setCoach(null)} />
      )}
      {coach === 'room' && tab === 'bedroom' && visiting === null && !modal && (
        <Onboarding
          place="room"
          onDone={() => {
            // The village's own coach marks follow on the first walk outside.
            setCoach(shouldOnboard() ? 'village' : null);
          }}
        />
      )}
      <Toast banners={banners} />
      {fade}
    </main>
  );
}
