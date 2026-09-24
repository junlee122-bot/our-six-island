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
  Check,
  House,
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
import { LoungePlayHub } from './lounge-play-hub';
import { gameFlow, playerIsBusy } from './lounge-game-flow';
import {
  AREA_DEFAULTS,
  GAME_INFO,
  GAME_KINDS,
  type GameKind,
} from './lounge-games';
import { loungeAudio } from './lounge-audio';
import {
  BagModal,
  FarmModal,
  MailModal,
  ShopModal,
  StatusModal,
} from './lounge/LifePanels';
import { FriendVisitScreen } from './lounge/FriendVisit';
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
import { josa, NAMES } from './lounge-text';
import {
  PASSWORD_WARNING_KEY,
  recall,
  remember,
  useSettings,
} from './lounge-settings';
import { Modal, ConfirmModal } from './lounge/Modal';
import { Toast, useToast } from './lounge/Toast';
import { ChatPanel } from './lounge/ChatPanel';
import { FriendsModal } from './lounge/FriendsModal';
import { Invitations } from './lounge/Invitations';
import { RequestGameModal } from './lounge/RequestGameModal';
import { WalletModal } from './lounge/WalletModal';
import { AccountModal } from './lounge/AccountModal';
import { SettingsModal } from './lounge/SettingsModal';
import { CreditsModal } from './lounge/CreditsModal';
import { WorldHeader, type Tab } from './lounge/WorldHeader';
import { GameScreen } from './lounge/GameScreen';
import { Onboarding, shouldOnboard } from './lounge/Onboarding';
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
const Village3D = lazyRetry(() =>
  import('./lounge-village').then((m) => ({ default: m.Village3D })),
);
const BedroomEditor = lazyRetry(() =>
  import('./lounge-bedroom').then((m) => ({ default: m.BedroomEditor })),
);
const Wardrobe = lazyRetry(() =>
  import('./lounge-wardrobe').then((m) => ({ default: m.Wardrobe })),
);
const RoomFloor = lazyRetry(() =>
  import('./lounge-scene').then((m) => ({ default: m.RoomFloor })),
);

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
      backLabel={`${josa(NAMES.village, '으로/로')} 돌아가기`}
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
  | 'status';
type Confirm = 'leaveRoom' | 'logout' | 'logoutAll' | 'reset';

const TAB_AREA: Record<Tab, Area> = {
  village: 'village',
  lounge: 'lounge',
  casino: 'casino',
  wardrobe: 'wardrobe',
  bedroom: 'home',
};

function Loading({ text }: { text: string }) {
  return (
    <div className="l-empty l-screen-loading">
      <span className="l-spinner" />
      <p>{text}</p>
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
    [toast, notify] = useToast(),
    [tab, setTab] = useState<Tab>('village'),
    [modal, setModal] = useState<ModalName | null>(null),
    [confirm, setConfirm] = useState<Confirm | null>(null),
    [gameScreen, setGameScreen] = useState<GameKind | null>(null),
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
    [coach, setCoach] = useState(false);
  const villagePosition = useRef<VillagePoint | undefined>(undefined),
    enteredPlace = useRef<VillagePlace | null>(null),
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

  // Village music, ambience and UI clicks (start after the first gesture).
  useEffect(() => loungeAudio.attach(), []);

  // New letters: a toast and a small chime (count only rises on arrival).
  const unread = view.life?.me.mailUnread ?? 0;
  const lastUnread = useRef<number | null>(null);
  useEffect(() => {
    if (lastUnread.current !== null && unread > lastUnread.current) {
      notify(`새 편지가 ${unread - lastUnread.current}통 왔어요. 우편함을 열어 보세요.`, 'info');
      loungeAudio.chime('mail');
    }
    lastUnread.current = unread;
  }, [unread, notify]);

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
      } else if (shouldOnboard()) setCoach(true);
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
          opened.set(kind, id);
          setGameScreen(kind);
          setModal(null);
          playCue('start');
        }
      }
    };
    check();
    return room.subscribe(check);
  }, [room]);

  // Invite arrivals (attention) and endings (specific reasons).
  const inviteStates = useRef(new Map<string, GameInvite>());
  const previousPlayers = useRef<LoungePlayer[]>([]);
  useEffect(() => {
    for (const invite of view.invites) {
      const prev = inviteStates.current.get(invite.id);
      const involved =
        invite.from === view.self || invite.invited.includes(view.self);
      if (
        !prev &&
        invite.status === 'waiting' &&
        invite.invited.includes(view.self) &&
        invite.from !== view.self
      )
        attention(
          'invite',
          `${nameOf(invite.from, view.players)}의 ${GAME_INFO[invite.game].name} 초대가 왔어요.`,
        );
      if (
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
      if (!ids.has(id)) inviteStates.current.delete(id);
    previousPlayers.current = view.players;
  }, [view.invites, view.players, view.self, notify]);

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

  // Contract #1: tell the server where I am whenever the tab changes.
  const sendArea = useCallback(
    (next: Tab) => {
      if (room.snapshot().status !== 'connected') return;
      if (next === 'village') {
        const p = villageToNetwork(villagePosition.current ?? VILLAGE_START);
        void room.area('village', p.x, p.y);
      } else void room.area(TAB_AREA[next]);
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
  const enter = (
    destination: VillageDestination | 'village' = 'village',
    place?: VillagePlace,
  ) => {
    if (place) enteredPlace.current = place;
    if (destination === 'village' && tab !== 'village') {
      const position = enteredPlace.current
        ? villageReturnPoint(enteredPlace.current)
        : villagePosition.current;
      setVillageSpawn(position);
      villagePosition.current = position;
      enteredPlace.current = null;
    }
    if (destination === 'village' && tab === 'wardrobe')
      setSave((s) => ({ ...s, visits: s.visits + 1 }));
    setModal(null);
    setTab(destination);
    if (destination !== tab) sendArea(destination);
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
  // Friends' rooms are shared: everyone in 'home' + owner sees each other.
  const visitHouse = (actor: number) => {
    if (actor === save.actor) {
      setVisiting(null);
      enter('bedroom');
      return;
    }
    if (view.life?.rooms?.[actor]?.access === 'closed') {
      notify(`${josa(ACTORS[actor] + '의 방', '은/는')} 지금 방문을 닫아 두었어요.`, 'info');
      return;
    }
    setModal(null);
    setVisiting(actor);
    if (connected)
      void room
        .area('home', AREA_DEFAULTS.home.x, AREA_DEFAULTS.home.y, actor)
        .then((ok) => {
          if (!ok) leaveVisit(actor);
        });
  };
  const leaveVisit = (owner = visiting) => {
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
  };
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
          notify(`${josa(ACTORS[p.actor], '이/가')} 내 방에 놀러 왔어요.`, 'info');
    roomGuests.current = new Set(here.map((p) => p.id));
  }, [view.players, view.self, save.actor, notify]);
  const guestbookUnread = view.life?.me.guestbookUnread ?? 0;
  const lastGuestbook = useRef<number | null>(null);
  useEffect(() => {
    if (lastGuestbook.current !== null && guestbookUnread > lastGuestbook.current)
      notify(`방명록에 새 글이 ${guestbookUnread}개 있어요. 내 방에서 읽어 보세요.`, 'info');
    lastGuestbook.current = guestbookUnread;
  }, [guestbookUnread, notify]);
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
  const requestGame = (kind: GameKind | null, preselect?: string[]) => {
    setRequest({ kind, preselect });
    setModal(
      !connected
        ? 'friends'
        : !kind || (playerIsBusy(view, view.self) && !preselect)
          ? 'games'
          : 'request',
    );
  };
  const openTable = (kind: GameKind) => {
    const flow = gameFlow(view, kind);
    if (flow.canOpen) {
      setModal(null);
      setGameScreen(kind);
    } else if (flow.canShowInvitations) setModal('invitations');
    else if (flow.canRequest) requestGame(kind);
    else setModal(connected ? 'games' : 'friends');
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
          onBack={() => setGameScreen(null)}
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
        onBrand={() =>
          tab === 'village' ? setModal('menu') : enter('village')
        }
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
              onClick={() => setGameScreen(retainedTable)}
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
        {tab !== 'lounge' && tab !== 'casino' && (
          <Invitations room={room} view={view} />
        )}
      </div>
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
                      onFarm={() => setModal('farm')}
                      onShop={() => setModal('shop')}
                      onMail={() => openMail()}
                      onPick={(tree) => void pickFruit(tree)}
                      onVisit={visitHouse}
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
                <p className="l-world-hint">
                  건물 이름을 눌러 걸어가요{' '}
                  <span>
                    · 방향키 / WASD · Shift 달리기 · E 입장·텃밭·상점
                  </span>
                </p>
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
              save={save}
              onChange={setSave}
              notice={(s) => notify(s)}
              unlocks={view.life?.me.unlocks}
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
              onBack={() => enter('village')}
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
              onEnter={() => enter('village')}
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
          <Invitations room={room} view={view} />
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
                    onTable={openTable}
                    view={view}
                    area={tab === 'casino' ? 'casino' : 'lounge'}
                  />
                </Suspense>
              </ScreenBoundary>
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
              {josa(NAMES.village, '으로/로')} 돌아가기
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
            <button onClick={() => setModal('bag')}>
              <Backpack size={20} />
              <span>가방</span>
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
                setCoach(true);
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
        <BagModal
          room={room}
          view={view}
          notify={notify}
          onClose={() => setModal(null)}
          onShop={() => setModal('shop')}
        />
      )}
      {modal === 'shop' && (
        <ShopModal
          room={room}
          view={view}
          notify={notify}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'mail' && (
        <MailModal
          room={room}
          view={view}
          notify={notify}
          selfActor={save.actor}
          initialTo={mailTo}
          onClose={() => setModal(null)}
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
      {coach && tab === 'village' && visiting === null && !modal && (
        <Onboarding onDone={() => setCoach(false)} />
      )}
      <Toast toast={toast} />
    </main>
  );
}
