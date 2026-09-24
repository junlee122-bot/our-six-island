'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  Shirt,
  Users,
  ArrowRight,
  Volume2,
  VolumeX,
  X,
  Copy,
  Send,
  Info,
  ArrowUpRight,
  LogOut,
  Check,
  Coins,
  Spade,
  House,
  Trees,
  Menu,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { AvatarView } from './avatar-view';
import { Wardrobe } from './lounge-wardrobe';
import { BedroomEditor } from './lounge-bedroom';
import { RoomFloor } from './lounge-scene';
import { Village3D } from './lounge-village';
import {
  villageFromNetwork,
  type VillageDestination,
  type VillagePlace,
  type VillagePoint,
} from './lounge-village-layout';
import { villageReturnPoint } from './lounge-village-entrance';
import './lounge-club.css';
import './lounge-village-shell.css';
import { ChessBoard, GoBoard } from './lounge-boards';
import { PokerTable, beom } from './lounge-poker-table';
import { BlackjackTable } from './lounge-blackjack-table';
import { SeotdaTable } from './lounge-seotda-table';
import { LoungePlayHub } from './lounge-play-hub';
import {
  gameFlow,
  gameIsActive,
  playerIsBusy,
  eligibleGameFriends,
} from './lounge-game-flow';
import { RoundReady } from './lounge-round-ready';
import {
  GAME_INFO,
  GAME_KINDS,
  gameReservation,
  type GameKind,
  type LoungeView,
} from './lounge-room';
import { CloudRoom as LoungeRoom } from './lounge-cloud-room';
import { AccountGate, PasswordForm, RecoveryCard } from './lounge-account-ui';
import { accountLogout } from './lounge-auth';
import { accountSave, type AccountProfile } from './lounge-accounts';
import { useCloudSave } from './lounge-cloud-save';
import {
  freshLounge,
  readLounge,
  LOUNGE_SAVE_KEY,
  type LoungeSave,
} from './lounge-look';
import { ACTORS, ACTOR_COLORS } from './theater-data';
import { LOUNGE_ASSETS } from './lounge-assets';
import { ReactionDock } from './lounge-reaction-ui';
import {
  REACTION_TTL,
  type Reaction,
  type ReactionId,
} from './lounge-reactions';

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    // Native dialog handles Escape; its click handler only dismisses the backdrop.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={'l-modal ' + (wide ? 'wide' : '')}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button className="l-icon" onClick={onClose} aria-label="닫기">
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Friends({
  room,
  view,
  save,
  onClose,
  notice,
}: {
  room: LoungeRoom;
  view: LoungeView;
  save: LoungeSave;
  onClose: () => void;
  notice: (s: string) => void;
}) {
  const [input, setInput] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('lounge') ?? '',
  );
  const invite = () => {
    const u = new URL(location.href);
    u.hash = 'lounge=' + view.code;
    return u.href;
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notice('초대 내용을 복사했어요.');
    } catch {
      notice('복사하지 못했어요. 표시된 초대 코드를 직접 전달해 주세요.');
    }
  };
  return (
    <Modal title="친구들과 만나요" onClose={onClose}>
      {view.status === 'connecting' ? (
        <div className="l-empty">
          <span className="l-spinner" />
          <h3>라운지에 연결 중이에요.</h3>
          <p>잠깐만 기다려 주세요.</p>
          <button className="l-secondary" onClick={() => room.leave()}>
            연결 취소
          </button>
        </div>
      ) : view.status === 'selecting' ? (
        <>
          <p className="l-modal-intro">
            함께할 친구를 골라 주세요. 먼저 선택한 캐릭터의 자리는 잠겨요.
          </p>
          <div className="l-claim-list">
            {ACTORS.map((name, i) => {
              const taken = view.players.some((p) => p.actor === i);
              return (
                <button
                  key={i}
                  disabled={taken || view.claiming !== null}
                  onClick={() => room.claim(i, save.looks[i])}
                >
                  <AvatarView actor={i} look={save.looks[i]} />
                  <strong>{name}</strong>
                  <span>
                    {taken
                      ? '참가 중'
                      : view.claiming === i
                        ? '입장 중…'
                        : '선택하기'}
                  </span>
                </button>
              );
            })}
          </div>
          <button className="l-text" onClick={() => room.leave()}>
            참가 취소
          </button>
        </>
      ) : view.status === 'connected' ? (
        <>
          <p className="l-modal-intro">
            같은 코드로 모여 함께 놀아요. 누가 방을 열었든 남은 친구들과 계속 놀
            수 있어요.
          </p>
          <div className="l-invite">
            <span>우리의 초대 코드</span>
            <strong>{view.code}</strong>
            <div>
              <button onClick={() => copy(view.code)}>
                <Copy size={15} />
                코드 복사
              </button>
              <button onClick={() => copy(invite())}>
                <Copy size={15} />
                링크 복사
              </button>
            </div>
          </div>
          <div className="l-online-list">
            {view.players.map((p) => (
              <div key={p.id}>
                <AvatarView actor={p.actor} look={p.look} portrait />
                <strong>{ACTORS[p.actor]}</strong>
                <span>
                  {p.id === view.self
                    ? '나'
                    : p.id === 'our-six-island-v1-' + view.code
                      ? '방장'
                      : '참가 중'}
                </span>
              </div>
            ))}
          </div>
          <button className="l-secondary" onClick={onClose}>
            라운지로
          </button>
          <button className="l-text danger" onClick={() => room.leave()}>
            <LogOut size={15} />
            방 나가기
          </button>
        </>
      ) : (
        <>
          <p className="l-modal-intro">
            최대 일곱 명까지. 코드를 공유하고 한 공간에서 옷도 갈아입고, 게임도
            즐겨 보세요.
          </p>
          <button
            className="l-host-card"
            onClick={() =>
              room.start('host', '', save.actor, save.looks[save.actor])
            }
          >
            <Users size={28} />
            <span>
              <strong>
                {room.activeRoom
                  ? '참가 중인 라운지로 돌아가기'
                  : '새 라운지 열기'}
              </strong>
              <small>{ACTORS[save.actor]}로 친구들을 초대해요</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <form
            className="l-join-form"
            onSubmit={(e) => {
              e.preventDefault();
              void room.start(
                'guest',
                input,
                save.actor,
                save.looks[save.actor],
              );
            }}
          >
            <label htmlFor="room-code">초대받은 라운지에 참가</label>
            <input
              id="room-code"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="초대 코드 또는 링크"
              maxLength={1000}
              autoComplete="off"
            />
            <button className="l-primary" disabled={!input.trim()}>
              참가하기
              <ArrowRight size={17} />
            </button>
          </form>
        </>
      )}
      {view.error && (
        <p role="alert" className="l-error">
          {view.error}
        </p>
      )}
    </Modal>
  );
}
function RequestGame({
  room,
  view,
  onClose,
  initial,
  notice,
}: {
  room: LoungeRoom;
  view: LoungeView;
  onClose: () => void;
  initial: GameKind | null;
  notice: (s: string) => void;
}) {
  const [game, setGame] = useState<GameKind>(initial ?? 'chess'),
    [stake, setStake] = useState<number>(GAME_INFO[initial ?? 'chess'].stake),
    [pokerCount, setPokerCount] = useState(
      Math.max(2, Math.min(3, view.players.length)),
    ),
    [chosen, setChosen] = useState<string[]>(
      view.players.filter((p) => p.id !== view.self).map((p) => p.id),
    );
  const [pending, setPending] = useState(false),
    [requestError, setRequestError] = useState('');
  const submitting = useRef(false);
  const needed =
      game === 'poker' || game === 'blackjack' || game === 'seotda'
        ? pokerCount
        : GAME_INFO[game].players,
    reserved = gameReservation(game, stake),
    active = (k: GameKind) => gameIsActive(view, k),
    busy = (id: string) => playerIsBusy(view, id),
    unavailable =
      !!view.tables?.[game]?.members.length ||
      active(game) ||
      view.invites.some((r) => r.game === game && r.status === 'waiting'),
    targets = chosen.filter((id) =>
      eligibleGameFriends(view, game, stake).some((p) => p.id === id),
    );
  return (
    <Modal title="함께할 게임을 골라요" onClose={onClose}>
      <p className="l-modal-intro">
        게임과 친구를 고르면 로비에 초대장이 도착해요. 필요한 인원이 수락하면
        게임 화면으로 함께 이동합니다.
      </p>
      <fieldset
        disabled={pending}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <div className="l-game-choices">
          {GAME_KINDS.map((k) => (
            <button
              key={k}
              aria-pressed={game === k}
              onClick={() => {
                setGame(k);
                setStake(GAME_INFO[k].stake);
              }}
            >
              <span>{GAME_INFO[k].symbol}</span>
              <strong>{GAME_INFO[k].name}</strong>
              <small>
                {k === 'chess'
                  ? '2인 · 한 수의 여유'
                  : k === 'gostop'
                    ? '3인 · 고와 스톱 사이'
                    : k === 'seotda'
                      ? '2–7인 · 두 장의 승부'
                      : '2–7인 · AI 딜러'}
              </small>
            </button>
          ))}
        </div>
        <div className="l-request-heading">
          <div className="l-money-settings">
            <label>
              {game === 'blackjack'
                ? '기본 베팅'
                : game === 'poker' || game === 'seotda'
                  ? '바이인'
                  : game === 'gostop'
                    ? '최대 손실'
                    : '판돈'}
              <select
                aria-label="참가 금액"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
              >
                {[1000, 5000, 10000, 20000].map((n) => (
                  <option key={n} value={n}>
                    {beom(n)}
                  </option>
                ))}
              </select>
            </label>
            {(game === 'poker' ||
              game === 'blackjack' ||
              game === 'seotda') && (
              <label>
                정원
                <select
                  aria-label={GAME_INFO[game].name + ' 정원'}
                  value={pokerCount}
                  onChange={(e) => setPokerCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7].map((n) => (
                    <option value={n} key={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p>
              {game === 'blackjack'
                ? `기본 베팅 ${beom(stake)} · 최대 ${beom(reserved)} 예약. 스플릿·더블에 쓰지 않은 금액은 종료 시 반환합니다.`
                : game === 'seotda'
                  ? '처음에 100범씩 냅니다. 바이인이 최대 손실이며, 재경기는 판돈을 유지하고 추가 참가비 없이 진행합니다.'
                  : game === 'poker'
                    ? '블라인드 100 / 200범. 바이인만큼의 칩으로 한 판을 진행합니다.'
                    : game === 'gostop'
                      ? '1점 = 100범. 선택한 최대 손실 안에서 정산합니다.'
                      : '승자가 판돈을 가져가며, 무승부는 전액 돌려받습니다.'}{' '}
              내 사용 가능 잔액: {beom(view.wallet.balance)}
            </p>
          </div>
        </div>
        <div className="l-request-heading">
          <h3>누구와 함께할까요?</h3>
          <small>나 + 친구 {needed - 1}명</small>
        </div>
        <div className="l-invite-targets">
          {view.players
            .filter((p) => p.id !== view.self)
            .map((p) => (
              <button
                key={p.id}
                disabled={
                  busy(p.id) ||
                  !eligibleGameFriends(view, game, stake).some(
                    (friend) => friend.id === p.id,
                  )
                }
                aria-pressed={chosen.includes(p.id)}
                onClick={() =>
                  setChosen((v) =>
                    v.includes(p.id)
                      ? v.filter((id) => id !== p.id)
                      : [...v, p.id],
                  )
                }
              >
                <AvatarView actor={p.actor} look={p.look} portrait />
                <strong>{ACTORS[p.actor]}</strong>
                <span>
                  {busy(p.id) ? (
                    '다른 테이블 참가 중'
                  ) : !eligibleGameFriends(view, game, stake).some(
                      (friend) => friend.id === p.id,
                    ) ? (
                    '잔액 부족'
                  ) : chosen.includes(p.id) ? (
                    <Check size={17} />
                  ) : null}
                </span>
              </button>
            ))}
        </div>
        {targets.length < needed - 1 && (
          <p className="l-help-text">
            참가 가능한 친구를 {needed - 1}명 이상 선택해 주세요. 금액을
            줄이거나 친구를 초대할 수 있어요.
          </p>
        )}
        {unavailable && (
          <p className="l-error">
            이 게임은 이미 진행 중이거나 친구들의 수락을 기다리고 있어요.
          </p>
        )}
        {busy(view.self) && (
          <p className="l-error">
            참가한 게임 또는 기다리는 초대가 있어요. 먼저 마친 뒤 요청해 주세요.
          </p>
        )}
        <p className="l-help-text">
          여러 명에게 보내면 먼저 수락한 {needed - 1}명과 시작합니다. 초대장은
          90초 동안 유효해요.
        </p>
      </fieldset>
      {requestError && (
        <p className="l-error" role="alert">
          {requestError}
        </p>
      )}
      <div className="l-modal-actions">
        <button className="l-secondary" onClick={onClose} disabled={pending}>
          다음에
        </button>
        <button
          className="l-primary"
          disabled={
            pending ||
            unavailable ||
            busy(view.self) ||
            targets.length < needed - 1 ||
            view.wallet.balance < reserved
          }
          onClick={async () => {
            if (submitting.current) return;
            submitting.current = true;
            setPending(true);
            setRequestError('');
            try {
              const ok = await room.action({
                kind: 'invite',
                game,
                players: targets,
                stake,
                required: needed,
              });
              if (ok) {
                onClose();
                notice('친구들의 참가 응답을 기다립니다.');
              } else
                setRequestError(
                  '초대를 보내지 못했어요. 접속 상태와 참가 가능 인원을 확인하고 다시 시도해 주세요.',
                );
            } catch {
              setRequestError('연결이 잠시 끊겼어요. 다시 시도해 주세요.');
            } finally {
              submitting.current = false;
              setPending(false);
            }
          }}
        >
          {pending ? '초대 보내는 중…' : '초대장 보내기'}
          <Send size={15} />
        </button>
      </div>
    </Modal>
  );
}
function Invitations({ room, view }: { room: LoungeRoom; view: LoungeView }) {
  const [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState('');
  const inFlight = useRef(false);
  const respond = async (id: string, accept?: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(id);
    setError('');
    try {
      const ok = await room.action(
        accept === undefined
          ? { kind: 'cancel', id }
          : { kind: 'reply', id, accept },
      );
      if (!ok)
        setError(
          '처리하지 못했어요. 초대 상태와 연결을 확인한 뒤 다시 눌러 주세요.',
        );
    } catch {
      setError('연결이 잠시 끊겼어요. 다시 시도해 주세요.');
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };
  const relevant = view.invites.filter(
    (r) =>
      (r.from === view.self || r.invited.includes(view.self)) &&
      r.status === 'waiting',
  );
  if (!relevant.length) return null;
  return (
    <div className="l-invitations" aria-live="polite">
      {error && (
        <p className="l-error" role="alert">
          {error}
        </p>
      )}
      {relevant.map((r) => {
        const accepted = r.accepted.includes(view.self),
          declined = r.declined.includes(view.self),
          sender = view.players.find((p) => p.id === r.from);
        return (
          <div key={r.id} className="l-invitation-card">
            <span className="l-envelope">{GAME_INFO[r.game].symbol}</span>
            <div>
              <strong>
                {r.from === view.self
                  ? '내가 보낸'
                  : (sender ? ACTORS[sender.actor] : '친구') + '의'}{' '}
                {GAME_INFO[r.game].name} 초대장
              </strong>
              <p>
                {accepted
                  ? '함께할 친구를 기다리는 중'
                  : declined
                    ? '이번에는 쉬어 가기로 했어요.'
                    : '같이 한 판 할까요?'}{' '}
                · {r.accepted.length}/{r.required}명 수락 ·{' '}
                {r.game === 'blackjack'
                  ? '기본 베팅 '
                  : r.game === 'gostop'
                    ? '최대 손실'
                    : r.game === 'poker' || r.game === 'seotda'
                      ? '바이인'
                      : '판돈'}{' '}
                {beom(r.stake)}
                {r.game === 'blackjack' &&
                  ` · 최대 ${beom(gameReservation(r.game, r.stake))} 예약`}
              </p>
            </div>
            {accepted ? (
              <button
                className="l-text"
                disabled={!!pending}
                onClick={() => void respond(r.id)}
              >
                초대 취소
              </button>
            ) : !declined ? (
              <div>
                <button
                  className="l-primary"
                  disabled={
                    !!pending ||
                    view.wallet.balance < gameReservation(r.game, r.stake)
                  }
                  onClick={() => void respond(r.id, true)}
                >
                  {view.wallet.balance < gameReservation(r.game, r.stake)
                    ? '범 잔액 부족'
                    : '참가하기'}
                </button>
                <button
                  className="l-text"
                  disabled={!!pending}
                  onClick={() => void respond(r.id, false)}
                >
                  다음에
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
export function GameScreen({
  kind,
  room,
  view,
  onBack,
  onRequest,
  reactionsHidden,
  onReactionsHidden,
}: {
  kind: GameKind;
  room: LoungeRoom;
  view: LoungeView;
  onBack: () => void;
  onRequest: (kind: GameKind) => void;
  reactionsHidden: boolean;
  onReactionsHidden: (value: boolean) => void;
}) {
  const [leave, setLeave] = useState(false),
    [leaving, setLeaving] = useState(false),
    [leaveError, setLeaveError] = useState(''),
    [displayedGoRevision, setDisplayedGoRevision] = useState(
      view.gostop?.revision,
    ),
    table = view.tables?.[kind],
    belongs = table?.members.includes(view.self),
    seats = view.seats[kind],
    seat = table && !belongs ? -1 : seats.indexOf(view.self),
    names = seats.map((id, i) => {
      const p = view.players.find((p) => p.id === id);
      return p
        ? ACTORS[p.actor]
        : (view.names[kind]?.[i] ??
            (i === 0 ? '참가자 1' : i === 1 ? '참가자 2' : '참가자 3'));
    }),
    match =
      kind === 'chess'
        ? view.chess
        : kind === 'gostop'
          ? view.gostop
          : view[kind],
    ended =
      kind === 'chess'
        ? !!view.chess?.winner
        : kind === 'gostop'
          ? view.gostop?.phase === 'over'
          : view[kind]?.phase === 'over';
  return (
    <section className={'l-game-screen ' + kind}>
      <header>
        <button
          className="l-game-back"
          onClick={onBack}
          title="로비를 둘러보는 동안에도 테이블 자리는 유지됩니다"
        >
          ← 로비 보기
        </button>
        <span>
          <small>
            BEOMDEW GAME CLUB{table ? ` · ${table.round}번째 판` : ''}
          </small>
          <strong>{GAME_INFO[kind].name}</strong>
        </span>
        <div>
          <span className="l-game-live">
            <i />
            {ended
              ? belongs
                ? '다음 판 준비'
                : '게임 종료'
              : seat < 0
                ? '관전 중'
                : '친구와 대전 중'}
          </span>
          {(belongs || seat >= 0) && (
            <button className="l-text" onClick={() => setLeave(true)}>
              게임 나가기
            </button>
          )}
        </div>
      </header>
      <div className="l-game-content">
        <ReactionDock
          players={view.players}
          self={view.self}
          scope={kind}
          matchId={match?.id}
          connected
          hidden={reactionsHidden}
          onHidden={onReactionsHidden}
          onSend={(id) =>
            room.action({
              kind: 'reaction',
              id,
              scope: kind,
              matchId: match?.id,
            })
          }
        />
        <div className="l-game-money">
          <span>
            {kind === 'blackjack'
              ? '최대 예약금에서 실제 베팅과 딜러 배당을 정산합니다.'
              : kind === 'seotda'
                ? '기본금 100범 · 바이인 한도 · 재경기는 판돈 유지'
                : kind === 'poker'
                  ? '바이인과 팟을 공통 범 지갑으로 정산합니다.'
                  : kind === 'gostop'
                    ? '1점 = 100범 · 초대장에서 합의한 최대 손실 적용'
                    : '초대장에서 합의한 판돈 · 무승부는 전액 반환'}
          </span>
          <b>
            <Coins size={14} /> {beom(view.wallet.balance)}
            {view.wallet.held > 0 ? ` · 예약 ${beom(view.wallet.held)}` : ''}
          </b>
        </div>
        <Invitations room={room} view={view} />
        {match ? (
          kind === 'chess' ? (
            <ChessBoard
              match={view.chess!}
              seat={seat}
              names={names}
              onMove={(from, to, promotion) =>
                void room.action({
                  kind: 'chess',
                  id: view.chess!.id,
                  ply: view.chess!.moves.length,
                  from,
                  to,
                  promotion,
                })
              }
              onResign={() =>
                void room.action({ kind: 'resign', id: view.chess!.id })
              }
            />
          ) : kind === 'seotda' ? (
            <SeotdaTable
              match={view.seotda!}
              seat={seat}
              names={names}
              onAction={(action) =>
                void room.action({
                  kind: 'seotda',
                  id: view.seotda!.id,
                  revision: view.seotda!.revision,
                  action,
                })
              }
            />
          ) : kind === 'blackjack' ? (
            <BlackjackTable
              match={view.blackjack!}
              seat={seat}
              names={names}
              onAction={(action) =>
                void room.action({
                  kind: 'blackjack',
                  id: view.blackjack!.id,
                  revision: view.blackjack!.revision,
                  action,
                })
              }
            />
          ) : kind === 'poker' ? (
            <PokerTable
              match={view.poker!}
              seat={seat}
              names={names}
              onAction={(action) =>
                void room.action({
                  kind: 'poker',
                  id: view.poker!.id,
                  revision: view.poker!.revision,
                  action,
                })
              }
            />
          ) : (
            <GoBoard
              match={view.gostop!}
              seat={seat}
              names={names}
              onDisplayChange={setDisplayedGoRevision}
              onAction={(action) =>
                void room.action({
                  kind: 'gostop',
                  id: view.gostop!.id,
                  ply: view.gostop!.ply,
                  action,
                })
              }
            />
          )
        ) : (
          <div className="l-empty">
            <h2>아직 시작된 게임이 없어요.</h2>
            <button className="l-primary" onClick={onBack}>
              로비로 돌아가기
            </button>
          </div>
        )}
        {ended &&
          belongs &&
          (kind !== 'gostop' ||
            displayedGoRevision === view.gostop?.revision) && (
            <RoundReady
              kind={kind}
              view={view}
              onReady={(ready) =>
                room.action({ kind: 'ready', game: kind, id: match!.id, ready })
              }
              onLeave={() => setLeave(true)}
            />
          )}
        {ended &&
          !belongs &&
          (kind !== 'gostop' ||
            displayedGoRevision === view.gostop?.revision) && (
            <div className="l-game-ending">
              <button
                className="l-primary"
                onClick={() => {
                  onBack();
                  onRequest(kind);
                }}
              >
                다시 초대하기
                <Send size={16} />
              </button>
              <button className="l-secondary" onClick={onBack}>
                로비로 돌아가기
              </button>
            </div>
          )}
      </div>
      {leave && (
        <Modal title="게임에서 나갈까요?" onClose={() => setLeave(false)}>
          <p className="l-modal-intro">
            {ended
              ? '이번 판의 정산은 이미 끝났어요. 나가면 다음 판 참가자에서 빠지고 준비 체크가 해제돼요.'
              : kind === 'chess'
                ? '지금 나가면 기권으로 처리됩니다.'
                : kind === 'blackjack'
                  ? '자리를 떠나면 남은 손을 자동 스탠드하고 정상적으로 범을 정산합니다. 게임으로 돌아와도 퇴장 결정을 취소할 수 없습니다.'
                  : kind === 'seotda'
                    ? '자리를 떠나면 다음 행동 차례에 자동으로 다이합니다. 이미 올인했다면 재경기를 포함해 승부까지 참가하고 범을 정산합니다. 퇴장은 취소할 수 없습니다.'
                    : kind === 'poker'
                      ? '자리를 떠나면 이후 차례는 체크가 가능할 때 체크, 그 외에는 폴드합니다. 이미 올인했다면 쇼다운까지 참가하고 범을 정산합니다.'
                      : '지금 나가면 이번 판은 점수 없이 종료되고 예약금을 돌려받습니다.'}
          </p>
          <div className="l-modal-actions">
            <button
              className="l-secondary"
              disabled={leaving}
              onClick={() => setLeave(false)}
            >
              테이블에 남기
            </button>
            <button
              className="l-primary"
              disabled={leaving}
              onClick={async () => {
                if (leaving) return;
                setLeaving(true);
                setLeaveError('');
                try {
                  if (
                    await room.action({
                      kind: 'stand',
                      game: kind,
                      id: match?.id,
                    })
                  )
                    onBack();
                  else
                    setLeaveError(
                      '나가기 요청을 처리하지 못했어요. 연결을 확인한 뒤 다시 눌러 주세요.',
                    );
                } catch {
                  setLeaveError('연결을 확인한 뒤 다시 눌러 주세요.');
                } finally {
                  setLeaving(false);
                }
              }}
            >
              {leaving ? '나가는 중…' : '게임 나가기'}
            </button>
          </div>
          {leaveError && <p role="alert">{leaveError}</p>}
        </Modal>
      )}
    </section>
  );
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
  const [room] = useState(() => new LoungeRoom(account)),
    view = useSyncExternalStore(room.subscribe, room.snapshot, room.snapshot),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState<
      'village' | 'lounge' | 'wardrobe' | 'casino' | 'bedroom'
    >('village'),
    [modal, setModal] = useState<
      | 'friends'
      | 'credits'
      | 'reset'
      | 'request'
      | 'games'
      | 'invitations'
      | 'wallet'
      | 'account'
      | 'menu'
      | 'chat'
      | null
    >(null),
    [gameScreen, setGameScreen] = useState<GameKind | null>(null),
    [requestKind, setRequestKind] = useState<GameKind | null>(null),
    [toast, setToast] = useState(''),
    [chat, setChat] = useState(''),
    [sound, setSound] = useState(false),
    [recoveryCode, setRecoveryCode] = useState(''),
    [accountBusy, setAccountBusy] = useState(false),
    [localPos, setLocalPos] = useState({ x: 50, y: 79 }),
    [localReaction, setLocalReaction] = useState<Reaction>(),
    [reactionsHidden, setReactionsHidden] = useState(false),
    [villageSpawn, setVillageSpawn] = useState<VillagePoint>();
  const audioRef = useRef<AudioContext | null>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    chatEnd = useRef<HTMLDivElement>(null),
    villagePosition = useRef<VillagePoint | undefined>(undefined),
    enteredPlace = useRef<VillagePlace | null>(null);
  const notice = useCallback((s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setReady(true);
      if (new URLSearchParams(location.hash.slice(1)).get('lounge'))
        setModal('friends');
    });
    room.init();
    return () => {
      active = false;
      room.dispose();
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void audioRef.current?.close();
    };
  }, [room]);
  const openedGames = useRef(new Map<GameKind, string>()),
    chessId = view.chess?.id,
    goId = view.gostop?.id,
    pokerId = view.poker?.id,
    blackjackId = view.blackjack?.id,
    seotdaId = view.seotda?.id;
  useEffect(() => {
    let active = true;
    if (view.status !== 'connected') {
      queueMicrotask(() => {
        if (active) setGameScreen(null);
      });
      return () => {
        active = false;
      };
    }
    const toOpen: [GameKind, string][] = [];
    for (const [kind, id] of [
      ['chess', chessId],
      ['gostop', goId],
      ['poker', pokerId],
      ['blackjack', blackjackId],
      ['seotda', seotdaId],
    ] as [GameKind, string | undefined][]) {
      if (
        id &&
        openedGames.current.get(kind) !== id &&
        view.seats[kind].includes(view.self)
      )
        toOpen.push([kind, id]);
    }
    if (toOpen.length)
      queueMicrotask(() => {
        if (!active) return;
        for (const [kind, id] of toOpen) {
          if (openedGames.current.get(kind) === id) continue;
          openedGames.current.set(kind, id);
          setGameScreen(kind);
          setModal(null);
        }
      });
    return () => {
      active = false;
    };
  }, [
    chessId,
    goId,
    pokerId,
    blackjackId,
    seotdaId,
    view.seats,
    view.status,
    view.self,
  ]);
  const inviteStates = useRef(new Map<string, string>());
  useEffect(() => {
    document.querySelector('.l-app')?.scrollTo({ top: 0 });
  }, [tab, gameScreen]);
  useEffect(() => {
    for (const invite of view.invites) {
      const prev = inviteStates.current.get(invite.id);
      if (
        prev === 'waiting' &&
        (invite.status === 'cancelled' || invite.status === 'expired') &&
        (invite.from === view.self || invite.invited.includes(view.self))
      )
        notice(
          invite.status === 'expired'
            ? '초대 시간이 지났어요. 친구들에게 다시 요청할 수 있어요.'
            : '초대가 취소됐어요. 로비에서 다시 만나요.',
        );
      inviteStates.current.set(invite.id, invite.status);
    }
    const currentIds = new Set(view.invites.map((invite) => invite.id));
    for (const id of inviteStates.current.keys())
      if (!currentIds.has(id)) inviteStates.current.delete(id);
  }, [view.invites, view.self, notice]);
  const me = view.players.find((p) => p.id === view.self);
  const retainedTable = GAME_KINDS.find((kind) =>
    view.tables?.[kind]?.members.includes(view.self),
  );
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [view.chat.length, modal]);
  useEffect(() => {
    let active = true;
    if (view.error)
      queueMicrotask(() => {
        if (active) notice(view.error);
      });
    return () => {
      active = false;
    };
  }, [view.error, notice]);
  const changeSave = (s: LoungeSave) => {
    setSave(s);
    if (view.status === 'connected' && s.actor === me?.actor)
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
    if (
      view.status === 'connected' &&
      !retainedTable &&
      (destination === 'lounge' || destination === 'village')
    )
      void room.action({ kind: 'area', area: 'lounge' });
    if (
      view.status === 'connected' &&
      !retainedTable &&
      destination === 'casino'
    )
      void room.action({ kind: 'area', area: 'casino' });
  };
  const move = useCallback(
    (x: number, y: number) => {
      if (view.status === 'connected') {
        void room.action({ kind: 'move', x, y });
      } else
        setLocalPos({
          x: Math.max(15, Math.min(85, x)),
          y: Math.max(42, Math.min(88, y)),
        });
    },
    [room, view.status],
  );
  const moveInVillage = useCallback(
    (x: number, y: number) => {
      villagePosition.current = villageFromNetwork({ x, y });
      move(x, y);
    },
    [move],
  );
  const greet = async (value: ReactionId) => {
    const scope = tab === 'casino' ? 'casino' : 'lounge';
    if (view.status === 'connected') {
      if (!(await room.action({ kind: 'reaction', id: value, scope })))
        return false;
    } else {
      const at = Date.now();
      setLocalReaction({ id: value, scope, at, expiresAt: at + REACTION_TTL });
    }
    if (sound) {
      const ac = audioRef.current ?? new AudioContext();
      audioRef.current = ac;
      void ac.resume();
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(value === 'love' ? 523 : 659, ac.currentTime);
      g.gain.setValueAtTime(0.045, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.3);
    }
    return true;
  };
  const requestGame = (kind: GameKind | null) => {
    setRequestKind(kind);
    setModal(
      view.status !== 'connected'
        ? 'friends'
        : !kind || playerIsBusy(view, view.self)
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
    else setModal(view.status === 'connected' ? 'games' : 'friends');
  };
  const self = view.status === 'connected' ? view.self : 'local';
  const players =
    view.status === 'connected'
      ? view.players
      : ACTORS.map((_, i) => ({
          id: i === save.actor ? 'local' : 'friend-' + i,
          actor: i,
          look: save.looks[i],
          x: [19, 37, 79, 63, 27, 74, 49][i],
          y: [53, 79, 52, 77, 73, 75, 47][i],
          emote: '',
          emoteAt: 0,
          balance: 0,
          area: (i === save.actor
            ? tab === 'casino'
              ? 'casino'
              : 'lounge'
            : i % 2
              ? 'casino'
              : 'lounge') as 'casino' | 'lounge',
          ...(i === save.actor ? { ...localPos, reaction: localReaction } : {}),
        }));
  const villagePlayers =
    tab === 'village' && view.status !== 'connected'
      ? players.map((p) => ({ ...p, area: 'lounge' as const }))
      : players;
  if (ready && gameScreen && view.status === 'connected')
    return (
      <main className="l-app">
        <GameScreen
          key={gameScreen + ':' + (view[gameScreen]?.id ?? 'waiting')}
          kind={gameScreen}
          room={room}
          view={view}
          onBack={() => {
            if (tab === 'village' && villagePosition.current)
              setVillageSpawn(villagePosition.current);
            setGameScreen(null);
          }}
          onRequest={requestGame}
          reactionsHidden={reactionsHidden}
          onReactionsHidden={setReactionsHidden}
        />
        {toast && (
          <output className="l-toast" aria-live="polite">
            {toast}
          </output>
        )}
      </main>
    );
  if (!ready)
    return (
      <main className="l-app l-loading">
        <span className="l-spinner" />
        <p>범타듀 밸리의 문을 여는 중…</p>
      </main>
    );
  return (
    <main
      className={`l-app ${tab === 'village' ? 'l-immersive' : 'l-interior'}`}
      data-space={tab}
    >
      <header className="l-header l-world-header">
        <button
          className="l-brand"
          onClick={() =>
            tab === 'village' ? setModal('menu') : enter('village')
          }
          data-testid={
            tab === 'village' ? 'village-menu-brand' : 'village-return'
          }
          aria-label={tab === 'village' ? '범타듀 밸리 메뉴' : '마을로 나가기'}
        >
          <span className="l-brand-icon">
            {tab === 'village' ? <Trees size={24} /> : <ArrowLeft size={22} />}
          </span>
          <span>
            <strong>
              {tab === 'village' ? '범타듀 밸리' : '마을로 나가기'}
            </strong>
            <small>
              {tab === 'village'
                ? '일곱 친구가 사는 마을'
                : tab === 'bedroom'
                  ? `${ACTORS[save.actor]}의 집`
                  : tab === 'wardrobe'
                    ? '분장실 · 나만의 코디'
                    : tab === 'casino'
                      ? '별빛 카지노'
                      : '범마을 회관'}
            </small>
          </span>
        </button>
        <div className="l-header-right">
          <button
            className="l-wallet-button"
            onClick={() => setModal('wallet')}
          >
            <Coins size={16} />
            {beom(view.wallet.balance)}
          </button>
          <button
            className="l-friends-button"
            onClick={() => setModal('friends')}
          >
            <Users size={17} />
            <span>
              {view.status === 'connected'
                ? `친구들 ${view.players.length}/7`
                : '친구 초대'}
            </span>
            {view.status === 'connected' && <i />}
          </button>
          <button
            className="l-profile"
            onClick={() => setModal('account')}
            title="내 계정"
            aria-label="내 계정"
          >
            <AvatarView
              actor={save.actor}
              look={save.looks[save.actor]}
              portrait
            />
            <span>{ACTORS[save.actor]}</span>
          </button>
          <button
            className="l-world-menu-button"
            aria-label="마을 메뉴"
            onClick={() => setModal('menu')}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      <div className="l-save-bar" hidden={tab === 'village'}>
        <span>
          <b>{account.username}</b> · {cloudSave.status}
        </span>
        <button onClick={() => void cloudSave.flush()}>지금 저장</button>
      </div>
      <div className="l-world-alerts">
        {retainedTable && view.status === 'connected' && (
          <aside
            className="l-retained-table"
            aria-label="유지 중인 게임 테이블"
          >
            <span>
              <strong>
                {GAME_INFO[retainedTable].name} 테이블에 자리가 있어요
              </strong>
              <small>
                로비를 둘러봐도 참가 상태는 유지돼요. 다음 판 준비는 게임
                화면에서 확인해 주세요.
              </small>
            </span>
            <button
              className="l-primary"
              onClick={() => setGameScreen(retainedTable)}
            >
              게임으로 돌아가기 <ArrowRight size={15} />
            </button>
          </aside>
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
        {tab === 'village' && <Invitations room={room} view={view} />}
      </div>
      {(tab === 'wardrobe' || tab === 'bedroom') && (
        <div className="l-wardrobe-invites">
          <Invitations room={room} view={view} />
        </div>
      )}
      {tab === 'village' ? (
        <section className="l-village">
          <div className="l-village-content">
            <div className="l-village-world">
              <Village3D
                save={save}
                players={villagePlayers}
                self={self}
                initialPosition={villageSpawn}
                onMove={moveInVillage}
                onEnter={enter}
                onFriends={() => setModal('friends')}
                onRequest={() => requestGame(null)}
              />
              <div className="l-world-social">
                <button
                  className="l-world-chat-button"
                  aria-label="마을 수다 열기"
                  onClick={() => setModal('chat')}
                >
                  <MessageCircle size={19} />
                  <span>수다</span>
                </button>
                <ReactionDock
                  players={villagePlayers}
                  self={self}
                  scope="lounge"
                  connected={view.status === 'connected'}
                  hidden={reactionsHidden}
                  onHidden={setReactionsHidden}
                  onSend={greet}
                />
              </div>
              <p className="l-world-hint">
                건물 이름을 눌러 걸어가요{' '}
                <span>· 방향키 / WASD · Shift 달리기 · E 입장</span>
              </p>
            </div>
          </div>
        </section>
      ) : tab === 'bedroom' ? (
        <BedroomEditor save={save} onChange={setSave} notice={notice} />
      ) : tab === 'wardrobe' ? (
        <Wardrobe
          save={save}
          onChange={changeSave}
          locked
          entry={false}
          onEnter={enter}
          notice={notice}
        />
      ) : (
        <section className={'l-lounge' + (tab === 'casino' ? ' l-casino' : '')}>
          <div className="l-section-title">
            <div>
              <span className="l-kicker">
                {tab === 'casino'
                  ? '회관 02 · 카드룸'
                  : '회관 01 · 우리 아지트'}
              </span>
              <h1>{tab === 'casino' ? '카지노' : '우리들의 회관'}</h1>
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
              <span>＋</span>게임 요청
            </button>
          </div>
          <Invitations room={room} view={view} />
          <div className="l-lounge-grid">
            <div className="l-room-wrap">
              <RoomFloor
                players={players}
                self={self}
                onMove={move}
                onTable={openTable}
                view={view}
                area={tab === 'casino' ? 'casino' : 'lounge'}
              />
              <div className="l-room-toolbar">
                <span>친구에게 한마디</span>
                <button
                  className="l-icon"
                  aria-label={sound ? '효과음 끄기' : '효과음 켜기'}
                  onClick={() => setSound(!sound)}
                >
                  {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
              <ReactionDock
                players={players}
                self={self}
                scope={tab === 'casino' ? 'casino' : 'lounge'}
                connected={view.status === 'connected'}
                hidden={reactionsHidden}
                onHidden={setReactionsHidden}
                onSend={greet}
              />
            </div>
            <aside className="l-lounge-sidebar">
              <div className="l-play-list">
                <span className="l-kicker">함께할 게임</span>
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
                      <small>친구에게 초대장을 보내요.</small>
                      <em>
                        {kind === 'chess'
                          ? '2명 · 관전 가능'
                          : kind === 'gostop'
                            ? '3명 · 화투와 범 베팅'
                            : kind === 'seotda'
                              ? '2–7명 · 두 장의 승부'
                              : '2–7명 · AI 딜러'}
                      </em>
                    </span>
                    <ArrowUpRight size={19} />
                  </button>
                ))}
              </div>
              <div className="l-chat">
                <div>
                  <h3>라운지 수다</h3>
                  <span>
                    {view.status === 'connected'
                      ? `${view.players.length}명`
                      : '친구를 기다려요'}
                  </span>
                </div>
                <div className="l-chat-messages" aria-live="polite">
                  {view.chat.length ? (
                    view.chat.map((m) => (
                      <p key={m.id}>
                        <b style={{ color: ACTOR_COLORS[m.actor] }}>
                          {ACTORS[m.actor]}
                        </b>
                        <span>{m.text}</span>
                      </p>
                    ))
                  ) : (
                    <div className="l-chat-welcome">
                      <Users size={27} />
                      <p>
                        {view.status === 'connected'
                          ? '오늘의 첫 인사를 남겨 보세요.'
                          : '친구를 초대하면 이곳에서 이야기할 수 있어요.'}
                      </p>
                      {view.status !== 'connected' && (
                        <button onClick={() => setModal('friends')}>
                          초대하기
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await room.action({ kind: 'chat', text: chat }))
                      setChat('');
                  }}
                >
                  <input
                    aria-label="채팅 메시지"
                    disabled={view.status !== 'connected'}
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    placeholder="친구에게 한마디…"
                    maxLength={120}
                  />
                  <button
                    aria-label="보내기"
                    disabled={view.status !== 'connected' || !chat.trim()}
                  >
                    <Send size={17} />
                  </button>
                </form>
              </div>
            </aside>
          </div>
          <button
            className="l-closet-invitation"
            onClick={() => enter('village')}
          >
            <Shirt size={29} />
            <span>
              <small>범타듀 밸리</small>
              <strong>다음에는 어디로 걸어갈까요?</strong>
            </span>
            <span>
              마을로 나가기
              <ArrowRight size={18} />
            </span>
          </button>
        </section>
      )}
      <footer className="l-footer">
        <span>범타듀 밸리 · 일곱 친구가 사는 마을</span>
        <div>
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- This static sibling page is published as a standalone HTML route. */}
          <a href="./theater.html">
            우당탕 극장
            <ArrowUpRight size={12} />
          </a>
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- This static sibling page is published as a standalone HTML route. */}
          <a href="./island.html">
            지난 섬으로
            <ArrowUpRight size={12} />
          </a>
          <button onClick={() => setModal('credits')}>
            <Info size={12} />
            만든 이야기
          </button>
          <button onClick={() => setModal('reset')}>초기화</button>
        </div>
      </footer>
      {modal === 'chat' && (
        <Modal title="마을 수다" onClose={() => setModal(null)}>
          <div className="l-chat l-village-chat">
            <div>
              <h3>마을 수다</h3>
              <span>
                {view.status === 'connected'
                  ? `${view.players.length}명`
                  : '친구를 기다려요'}
              </span>
            </div>
            <div className="l-chat-messages" aria-live="polite">
              {view.chat.length ? (
                view.chat.map((m) => (
                  <p key={m.id}>
                    <b style={{ color: ACTOR_COLORS[m.actor] }}>
                      {ACTORS[m.actor]}
                    </b>
                    <span>{m.text}</span>
                  </p>
                ))
              ) : (
                <div className="l-chat-welcome">
                  <Users size={23} />
                  <p>
                    {view.status === 'connected'
                      ? '오늘의 첫 인사를 남겨 보세요.'
                      : '친구를 초대하면 이곳에서 이야기할 수 있어요.'}
                  </p>
                  {view.status !== 'connected' && (
                    <button onClick={() => setModal('friends')}>
                      초대하기 <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await room.action({ kind: 'chat', text: chat }))
                  setChat('');
              }}
            >
              <input
                aria-label="채팅 메시지"
                disabled={view.status !== 'connected'}
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="친구에게 한마디…"
                maxLength={120}
              />
              <button
                aria-label="보내기"
                disabled={view.status !== 'connected' || !chat.trim()}
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </Modal>
      )}
      {modal === 'menu' && (
        <Modal title="범타듀 밸리" onClose={() => setModal(null)}>
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
          <p className="l-modal-intro">
            건물 이름을 누르면 문 앞으로 걸어가요. 입구에 도착하면 E 키 또는
            들어가기 버튼을 눌러 주세요.
          </p>
          <div className="l-world-menu-grid">
            <button onClick={() => setModal('friends')}>
              <Users size={20} />
              <span>친구들과 만나기</span>
            </button>
            <button onClick={() => requestGame(null)}>
              <Spade size={20} />
              <span>게임 초대하기</span>
            </button>
            <button onClick={() => void cloudSave.flush()}>
              <Check size={20} />
              <span>지금 저장</span>
            </button>
            <button onClick={() => setModal('account')}>
              <House size={20} />
              <span>내 계정</span>
            </button>
            <button aria-pressed={sound} onClick={() => setSound(!sound)}>
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span>효과음 {sound ? '켜짐' : '꺼짐'}</span>
            </button>
            <button onClick={() => setModal('credits')}>
              <Info size={20} />
              <span>만든 이야기 · 출처</span>
            </button>
          </div>
          <div className="l-world-menu-links">
            <button
              aria-pressed={!reactionsHidden}
              onClick={() => setReactionsHidden(!reactionsHidden)}
            >
              친구 스티커 {reactionsHidden ? '숨김' : '표시 중'}
            </button>
            {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Static legacy game pages. */}
            <a href="./theater.html">
              우당탕 극장 <ArrowUpRight size={12} />
            </a>
            {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Static legacy game pages. */}
            <a href="./island.html">
              지난 섬으로 <ArrowUpRight size={12} />
            </a>
            <button onClick={() => setModal('reset')}>코디 초기화</button>
          </div>
        </Modal>
      )}
      {modal === 'account' && (
        <Modal
          title="내 계정"
          onClose={() => {
            if (!recoveryCode) setModal(null);
          }}
        >
          {recoveryCode ? (
            <RecoveryCard
              username={account.username}
              code={recoveryCode}
              onDone={() => setRecoveryCode('')}
            />
          ) : (
            <>
              <div className="l-account-summary">
                <AvatarView
                  actor={account.actor}
                  look={save.looks[account.actor]}
                  portrait
                />
                <div>
                  <h3>{ACTORS[account.actor]}</h3>
                  <code>{account.username}</code>
                  <p>{cloudSave.status}</p>
                </div>
              </div>
              <div className="l-account-actions">
                <button
                  className="l-secondary"
                  onClick={() => void cloudSave.flush()}
                >
                  지금 저장
                </button>
                <button
                  className="l-secondary"
                  onClick={() => {
                    try {
                      const old = readLounge(
                        localStorage.getItem(LOUNGE_SAVE_KEY),
                      );
                      setSave((s) => ({
                        ...s,
                        looks: s.looks.map((look, i) =>
                          i === account.actor ? old.looks[i] : look,
                        ),
                        saved: old.saved.filter(
                          (c) => c.actor === account.actor,
                        ),
                      }));
                      notice('이 기기의 이전 코디를 불러왔어요.');
                    } catch {
                      notice('이전 코디를 읽을 수 없어요.');
                    }
                  }}
                >
                  이 기기의 이전 코디 가져오기
                </button>
              </div>
              <p className="l-help-text">
                현재 코디가 이전 코디로 바뀝니다. 범 잔액과 지난 섬·극장 기록은
                옮기지 않아요.
              </p>
              <details className="l-password-settings">
                <summary>비밀번호 변경</summary>
                <PasswordForm account={account} onChanged={setRecoveryCode} />
              </details>
              <button
                className="l-text danger"
                disabled={accountBusy}
                onClick={async () => {
                  setAccountBusy(true);
                  try {
                    if (!(await cloudSave.flush())) {
                      notice(
                        '저장을 마치거나 다른 창의 변경 사항을 먼저 확인해 주세요.',
                      );
                      return;
                    }
                    if (!(await room.leave())) return;
                    await accountLogout(account.id);
                    onLogout();
                  } catch (e) {
                    notice(
                      e instanceof Error ? e.message : '로그아웃하지 못했어요.',
                    );
                  } finally {
                    setAccountBusy(false);
                  }
                }}
              >
                <LogOut size={16} />
                {accountBusy ? '저장 후 나가는 중…' : '저장하고 로그아웃'}
              </button>
            </>
          )}
        </Modal>
      )}
      {modal === 'friends' && (
        <Friends
          room={room}
          view={view}
          save={save}
          onClose={() => setModal(null)}
          notice={notice}
        />
      )}
      {modal === 'wallet' && (
        <Modal title="내 범 지갑" onClose={() => setModal(null)}>
          <div className="l-wallet-info">
            <small>모든 게임에서 함께 쓰는 우리들의 화폐</small>
            <strong>{beom(view.wallet.balance)}</strong>
            <p>
              {view.wallet.held > 0
                ? `게임에 예약한 금액 ${beom(view.wallet.held)}`
                : '체스 · 고스톱 · 섯다 · 홀덤 · 블랙잭의 베팅과 정산에 사용해요.'}
            </p>
          </div>
          <p className="l-help-text">
            {account.username} 계정의 공통 지갑이에요. 모든 방과 기기에서 잔액이
            이어집니다. 게임 종료 시 서버에서 자동 정산되며 옷장 초기화로 다시
            지급되지 않아요.
          </p>
          {view.wallet.history.length > 0 && (
            <ul className="l-wallet-history">
              {view.wallet.history.map((h) => (
                <li key={h.id}>
                  <span>{GAME_INFO[h.game as GameKind]?.name ?? h.game}</span>
                  <b>
                    {h.delta > 0 ? '+' : ''}
                    {beom(h.delta)}
                  </b>
                </li>
              ))}
            </ul>
          )}
          {view.status !== 'connected' && (
            <button className="l-primary" onClick={() => setModal('friends')}>
              친구들과 시작하기
            </button>
          )}
        </Modal>
      )}
      {modal === 'games' && (
        <Modal title="함께할 게임" onClose={() => setModal(null)}>
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
        <RequestGame
          room={room}
          view={view}
          initial={requestKind}
          onClose={() => setModal(null)}
          notice={notice}
        />
      )}
      {modal === 'reset' && (
        <Modal title="내 라운지를 처음부터" onClose={() => setModal(null)}>
          <p className="l-modal-intro">
            내 계정의 코디와 보관한 의상을 초기화합니다. 접속 중인 방에서는
            나가게 됩니다. 다른 친구의 기록은 바뀌지 않아요.
          </p>
          <p className="l-help-text">
            범 지갑과 지난 섬, 우당탕 극장의 저장 기록은 그대로 남아요.
          </p>
          <div className="l-modal-actions">
            <button className="l-secondary" onClick={() => setModal(null)}>
              계속 간직하기
            </button>
            <button
              className="l-primary"
              onClick={async () => {
                if (!(await room.leave())) return;
                setSave({
                  ...accountSave(freshLounge(), account.actor),
                  bedroom: save.bedroom,
                });
                setTab('wardrobe');
                setModal(null);
                setLocalPos({ x: 50, y: 79 });
                villagePosition.current = undefined;
                enteredPlace.current = null;
                setVillageSpawn(undefined);
                notice('코디를 초기화했어요. 서버 저장 상태를 확인해 주세요.');
              }}
            >
              내 라운지 초기화
            </button>
          </div>
        </Modal>
      )}
      {modal === 'credits' && (
        <Modal title="함께 만든 범타듀 밸리" onClose={() => setModal(null)}>
          <div className="l-credits">
            <h3>마을과 방</h3>
            <p>
              <a
                href="https://karchive.vibeline.co.kr/models"
                target="_blank"
                rel="noreferrer"
              >
                kArchive
              </a>{' '}
              · 출처: 쓰레드 dogfooter. 주택·과일나무·수국·소파·튤립 원본 모델을
              사용했습니다. 테라스와 방의 가구는 3DAssets.dev (CC0)입니다.
            </p>
            <p>
              공간을 걸으며 기능을 만나는 구성은{' '}
              <a
                href="https://www.stardewvalley.net/"
                target="_blank"
                rel="noreferrer"
              >
                Stardew Valley
              </a>
              와{' '}
              <a
                href="https://support.gather.town/articles/5874848981-objects-overview"
                target="_blank"
                rel="noreferrer"
              >
                Gather
              </a>
              의 공간·상호작용 방식을 참고했습니다.
            </p>
            <h3>친구들의 모습</h3>
            <p>
              도원 · 강재 · 민서 · 승준 · 민재 · 재민 · 호현. 기존 캐릭터 모션과
              안경, 모자 에셋을 재사용했고, 새 전신 의상과 라운지 배경은 AI
              이미지 생성으로 제작했습니다. 새 의상은 전신 그림으로 전환하며,
              기존 의상의 걷기·인사는 원래 프레임을 사용합니다.
            </p>
            <h3>체스</h3>
            <p>
              규칙:{' '}
              <a
                href="https://github.com/jhlywa/chess.js"
                target="_blank"
                rel="noreferrer"
              >
                chess.js
              </a>{' '}
              (BSD-2-Clause). 기물:{' '}
              <a
                href="https://github.com/LexLuengas/chessnut-pieces"
                target="_blank"
                rel="noreferrer"
              >
                Chessnut
              </a>{' '}
              · Alexis Luengas (Apache-2.0), 원본 SVG.
            </p>
            <h3>화투</h3>
            <p>
              <a
                href="https://commons.wikimedia.org/wiki/File:Hwatu_January_Hikari.svg"
                target="_blank"
                rel="noreferrer"
              >
                Spenĉjo의 Hwatu
              </a>{' '}
              · Marcus Richert 디자인, Louie Mantia Jr. 원안.{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>
              .{' '}
              <a
                href="https://github.com/itsent-lab/hwatu/tree/main/apps/web/public/cards/hwatu"
                target="_blank"
                rel="noreferrer"
              >
                공개 SVG 48장
              </a>
              을 수정 없이 사용했습니다.
            </p>
            <p>
              고스톱은 3인 기본 룰, 섯다는 2–7인 두 장 섯다입니다. 각 테이블의
              규칙 보기에서 특수 족보와 재경기 규칙을 확인할 수 있어요.
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <output className="l-toast" aria-live="polite">
          <Check size={16} />
          {toast}
        </output>
      )}
    </main>
  );
}
