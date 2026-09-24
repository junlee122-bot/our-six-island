import { emptyLoungeView } from './lounge-games';
import type { LoungeView, LoungeWorld, LoungeAction } from './lounge-room';
import type { LifeAction, LifeView } from './lounge-life';
import { cloud, cloudCall, AccountError } from './lounge-auth';
import type { AccountProfile } from './lounge-accounts';
import type { CloudCommand } from './lounge-cloud-engine';
import type { Look } from './lounge-look';
import { roomCode } from './multiplayer-protocol';
import { receiveReaction } from './lounge-reactions';
import { friendlyError } from './lounge/feedback';
import { lastRoomKey, recall, remember } from './lounge-settings';
import { setServerClockOffset } from './lounge-turn-timer';

/**
 * The always-on village: every friend joins this well-known room after login,
 * so nobody has to share codes. The server's `open` op joins-or-creates a room
 * with a given code and keeps a member in their current room if they already
 * have one, so this needs no new server operation.
 * Code alphabet: [A-HJ-NP-Z2-9]{10} (see roomCode).
 */
export const VILLAGE_CODE = 'BEMTADUVLY';
/** Subscribe to the room's Realtime channel as a private (RLS-authorized) channel. See WS1 notes. */
export const PRIVATE_REALTIME = true;
const VISIBLE_POLL_MS = 8000;
const HIDDEN_POLL_MS = 45000;

type Response = {
  ok: boolean;
  error: string;
  status: number;
  revision: number;
  epoch: number;
  code: string;
  host: string | null;
  packet: LoungeWorld | null;
  wallet: LoungeWorld['wallet'];
  activeRoom: string | null;
  nextDue: number | null;
  serverNow: number;
  /** Phase 2 life block (farm, bag, mail…) on every world response. */
  life?: LifeView;
};

export type Area = 'village' | 'lounge' | 'casino' | 'wardrobe' | 'home';

/** Client-only extras layered on the server view. */
export type CloudRoomView = LoungeView & {
  /** Number of actions sent and not yet answered. */
  pending: number;
  /** Increments on every error so repeated identical errors still surface. */
  errorSeq: number;
  /** The room this account was last connected to (per account, persisted). */
  lastRoom: string | null;
  /** True when the room dropped us (e.g. after a long background); UI offers "다시 들어가기". */
  lost: boolean;
  /** Server clock minus local clock, for countdowns. */
  clockOffset: number;
  /** Member id of the room opener as reported by the server (contract #3). */
  host?: string;
  /** Latest "범타듀의 하루" state from any response (null until the first one). */
  life: LifeView | null;
};

export class CloudRoom {
  private view: CloudRoomView;
  private listeners = new Set<() => void>();
  private connection = crypto.randomUUID();
  private sequence = 0;
  private revision = -1;
  private epoch = 0;
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private channel: ReturnType<typeof cloud.channel> | null = null;
  private reading = false;
  private stopped = false;
  private movement: LoungeAction | null = null;
  private moveTimer: ReturnType<typeof setTimeout> | null = null;
  private moving = false;
  private look: Look | null = null;
  private detach: (() => void) | null = null;
  activeRoom: string | null = null;
  private account: AccountProfile;
  constructor(account: AccountProfile) {
    this.account = account;
    this.view = {
      ...emptyLoungeView(),
      self: account.id,
      pending: 0,
      errorSeq: 0,
      lastRoom: recall(lastRoomKey(account.id)),
      lost: false,
      clockOffset: 0,
      life: null,
    };
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.view;
  private update(p: Partial<CloudRoomView>) {
    const next = { ...this.view, ...p };
    if (p.error) next.errorSeq = this.view.errorSeq + 1;
    this.view = next;
    for (const fn of this.listeners) fn();
  }
  private fail(error: unknown, fallback?: string) {
    this.update({ error: friendlyError(error, fallback) });
  }
  private base(extra: Partial<CloudRoomView> = {}): CloudRoomView {
    return {
      ...emptyLoungeView(),
      self: this.account.id,
      wallet: this.view.wallet,
      pending: 0,
      errorSeq: this.view.errorSeq,
      lastRoom: this.view.lastRoom,
      lost: false,
      clockOffset: this.view.clockOffset,
      life: this.view.life,
      ...extra,
    };
  }
  /** Starts polling and, when `look` is given, joins the village (or the invite-link room). */
  init(look?: Look, inviteCode?: string | null) {
    this.stopped = false;
    this.listen();
    if (look) {
      this.look = look;
      void this.start('host', inviteCode ?? VILLAGE_CODE, look);
    } else void this.refresh();
  }
  dispose() {
    this.stopped = true;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    if (this.moveTimer) clearTimeout(this.moveTimer);
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.detach?.();
    this.detach = null;
    void this.channel?.unsubscribe();
    this.channel = null;
  }
  private listen() {
    if (this.detach || typeof document === 'undefined') return;
    const wake = () => {
      if (this.stopped) return;
      if (document.visibilityState === 'hidden') {
        this.schedule();
        return;
      }
      void this.refresh();
    };
    const online = () => void this.refresh();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('online', online);
    this.detach = () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
      window.removeEventListener('online', online);
    };
  }
  private schedule(ms = VISIBLE_POLL_MS) {
    if (this.timer) clearTimeout(this.timer);
    if (this.stopped) return;
    const hidden =
      typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const delay = hidden ? Math.max(ms, HIDDEN_POLL_MS) : ms;
    this.timer = setTimeout(() => void this.refresh(), Math.max(250, delay));
  }
  private lastHint = 0;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  /** Throttled refresh for Realtime hints: leading + trailing, ≤1 per 500ms. */
  private hint() {
    const wait = this.lastHint + 500 - Date.now();
    if (wait <= 0) {
      this.lastHint = Date.now();
      this.schedule(80);
      return;
    }
    if (this.hintTimer) return;
    this.hintTimer = setTimeout(() => {
      this.hintTimer = null;
      this.lastHint = Date.now();
      if (this.reading) this.schedule(250);
      else void this.refresh();
    }, wait);
  }
  private subscribeChannel(code: string) {
    if (this.channel) return;
    const name = 'hh-cloud-' + code;
    const channel = PRIVATE_REALTIME
      ? cloud.channel(name, { config: { private: true } })
      : cloud.channel(name);
    this.channel = channel;
    channel.on('broadcast', { event: 'revision' }, (message) => {
      const revision = Number(
        (message as { payload?: { revision?: unknown } }).payload?.revision,
      );
      // Our own actions already returned the new packet; skip their echoes.
      if (Number.isFinite(revision) && revision <= this.revision) return;
      this.hint();
    });
    const subscribe = () => {
      if (this.channel === channel) channel.subscribe();
    };
    if (PRIVATE_REALTIME)
      void cloud.realtime
        .setAuth()
        .catch(() => {})
        .then(subscribe);
    else subscribe();
  }
  private dropChannel() {
    void this.channel?.unsubscribe();
    this.channel = null;
  }
  private apply(r: Response, generation: number) {
    if (
      this.stopped ||
      generation !== this.generation ||
      r.revision < this.revision
    )
      return;
    this.revision = r.revision;
    this.epoch = r.epoch;
    this.activeRoom = r.activeRoom;
    const clockOffset = Number.isFinite(r.serverNow)
      ? r.serverNow - Date.now()
      : this.view.clockOffset;
    setServerClockOffset(clockOffset);
    const life = r.life ?? (r.packet as { life?: LifeView } | null)?.life;
    if (life) this.view = { ...this.view, life };
    if (r.packet && r.code) {
      const localNow = Date.now();
      const players = r.packet.players.map((p) => ({
        ...p,
        reaction: receiveReaction(
          p.reaction,
          this.view.code === r.code
            ? this.view.players.find((old) => old.id === p.id)?.reaction
            : undefined,
          r.serverNow,
          localNow,
        ),
      }));
      if (this.view.lastRoom !== r.code)
        remember(lastRoomKey(this.account.id), r.code);
      this.update({
        ...r.packet,
        players,
        self: this.account.id,
        code: r.code,
        role: r.host === this.account.id ? 'host' : 'guest',
        host: (r.packet as { host?: string }).host ?? r.host ?? undefined,
        status: 'connected',
        claiming: null,
        lastRoom: r.code,
        lost: false,
        clockOffset,
        ...(r.ok ? {} : { error: friendlyError(r.error) }),
      });
      this.subscribeChannel(r.code);
    } else {
      this.update({
        wallet: r.wallet,
        clockOffset,
        ...(!r.ok ? { error: friendlyError(r.error) } : {}),
      });
      if (
        this.view.status === 'connected' &&
        (r.status === 409 || r.status === 404)
      ) {
        this.dropChannel();
        this.view = this.base({
          status: 'error',
          wallet: r.wallet,
          lost: true,
        });
        this.update({
          error:
            r.status === 404
              ? '연결이 오래 끊겨 마을에서 나왔어요. 다시 들어가기를 눌러 주세요.'
              : friendlyError(r.error),
        });
      }
    }
    this.schedule(
      r.nextDue
        ? Math.min(VISIBLE_POLL_MS, r.nextDue - r.serverNow + 150)
        : VISIBLE_POLL_MS,
    );
  }
  private async send(command: CloudCommand, generation: number) {
    let result: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await cloudCall<Response>(
          'hohyeon-api',
          { op: 'world', command },
          true,
          this.account.id,
        );
        break;
      } catch (e) {
        if (!(e instanceof AccountError) || e.status < 500 || attempt === 2)
          throw e;
      }
    }
    if (!result) throw new Error('서버 응답이 없습니다.');
    this.apply(result, generation);
    return result;
  }
  async refresh() {
    if (this.stopped || this.reading) return;
    this.reading = true;
    const g = this.generation;
    try {
      await this.send(
        {
          op: this.view.status === 'connected' ? 'read' : 'wallet',
          code: this.view.code,
          connection: this.connection,
        },
        g,
      );
    } catch (e) {
      if (!this.stopped && g === this.generation)
        this.fail(e, '연결을 확인해 주세요.');
      this.schedule();
    } finally {
      this.reading = false;
    }
  }
  private enqueue(
    command: Omit<CloudCommand, 'requestId' | 'sequence' | 'connection'>,
  ) {
    const g = this.generation,
      body: CloudCommand = {
        ...command,
        requestId: crypto.randomUUID(),
        sequence: ++this.sequence,
        connection: this.connection,
      };
    this.update({ pending: this.view.pending + 1 });
    const task = this.queue.then(async () => {
      if (this.stopped || g !== this.generation) return false;
      try {
        return (await this.send(body, g)).ok;
      } catch (e) {
        if (g === this.generation) this.fail(e);
        return false;
      }
    });
    this.queue = task;
    void task.finally(() =>
      this.update({ pending: Math.max(0, this.view.pending - 1) }),
    );
    return task;
  }
  private clearInviteHash() {
    try {
      if (/(^#|&)lounge=/.test(location.hash))
        history.replaceState(
          history.state,
          '',
          location.pathname + location.search,
        );
    } catch {}
  }
  /**
   * role 'host' opens (join-or-create) `input` or a fresh random room when empty;
   * role 'guest' joins an existing room from a code or invite link.
   */
  async start(role: 'host' | 'guest', input: string, look: Look) {
    if (this.view.status === 'connecting') return false;
    this.look = look;
    const generation = this.generation;
    let code = '';
    if (input) {
      try {
        code =
          roomCode(input) ||
          roomCode(new URL(input).hash.replace(/^#lounge=/, '')) ||
          '';
      } catch {
        code = roomCode(input) || '';
      }
      if (!code && role === 'guest') {
        this.update({ error: '10자리 초대 코드나 초대 링크를 입력해 주세요.' });
        return false;
      }
    }
    this.update({ status: 'connecting', error: '', lost: false });
    try {
      await this.send({ op: 'wallet' }, this.generation);
      if (generation !== this.generation || this.stopped) return false;
    } catch (e) {
      this.update({ status: 'error' });
      this.fail(e, '연결하지 못했어요.');
      return false;
    }
    const ok = await this.enqueue({
      op: role === 'host' ? 'open' : 'join',
      code,
      look,
      epoch: this.epoch,
    });
    if (ok) this.clearInviteHash();
    else if (this.view.status !== 'connected') this.update({ status: 'error' });
    return ok;
  }
  /** Joins (or rejoins) the always-on village room. */
  joinVillage(look?: Look) {
    const l = look ?? this.look;
    if (!l) return Promise.resolve(false);
    return this.start('host', VILLAGE_CODE, l);
  }
  /** Returns to the last room this account used (after a background drop). */
  rejoin(look?: Look) {
    const l = look ?? this.look;
    if (!l) return Promise.resolve(false);
    const code = this.view.lastRoom;
    return code && code !== VILLAGE_CODE
      ? this.start('guest', code, l)
      : this.joinVillage(l);
  }
  /** Leaves the current room and joins another one (advanced code/link option). */
  async switchTo(input: string, look?: Look) {
    const l = look ?? this.look;
    if (!l) return false;
    if (this.view.status === 'connected' && !(await this.leave())) return false;
    return this.start('guest', input, l);
  }
  claim(_actor: number, look: Look) {
    return this.start('guest', this.view.code, look);
  }
  /** Contract #1: tell the server which area I am in (and my village position). */
  area(area: Area, x?: number, y?: number, home?: number) {
    const action = {
      kind: 'area',
      area,
      // 'home' + owner: whose room I walk into (my own when omitted).
      ...(area === 'home' && Number.isInteger(home) ? { home } : {}),
      ...(Number.isFinite(x) && Number.isFinite(y)
        ? {
            x: Math.max(0, Math.min(100, x!)),
            y: Math.max(0, Math.min(100, y!)),
          }
        : {}),
    } as unknown as LoungeAction;
    return this.action(action);
  }
  /** Contract #5: claim the daily grant (works inside or outside a room). */
  daily() {
    const action = { kind: 'daily' } as unknown as LoungeAction;
    if (this.view.status === 'connected') return this.action(action);
    return this.enqueue({ op: 'action', action });
  }
  /**
   * "범타듀의 하루" actions (plant, water, harvest, pick, sell, buy, guestbook,
   * mail, readMail, status). Work inside or outside a room, like daily().
   */
  life(action: LifeAction) {
    const a = action as unknown as LoungeAction;
    if (this.view.status === 'connected') return this.action(a);
    return this.enqueue({ op: 'action', action: a });
  }
  /** Sends an action; resolves when the server answered (true = accepted). */
  action(action: LoungeAction): Promise<boolean> {
    if (this.view.status !== 'connected') return Promise.resolve(false);
    if (action.kind === 'move') {
      this.movement = action;
      this.update({
        players: this.view.players.map((p) =>
          p.id === this.account.id
            ? {
                ...p,
                x: Math.max(15, Math.min(85, action.x)),
                y: Math.max(42, Math.min(88, action.y)),
              }
            : p,
        ),
      });
      if (!this.moveTimer && !this.moving)
        this.moveTimer = setTimeout(async () => {
          this.moveTimer = null;
          this.moving = true;
          const move = this.movement;
          this.movement = null;
          if (move && this.view.status === 'connected')
            await this.enqueue({
              op: 'action',
              code: this.view.code,
              action: move,
            });
          this.moving = false;
          if (this.movement && this.view.status === 'connected')
            void this.action(this.movement);
        }, 500);
      return Promise.resolve(true);
    }
    return this.enqueue({ op: 'action', code: this.view.code, action });
  }
  async leave() {
    // Keep a pending join in the same queue, then leave its acknowledged room.
    await this.queue;
    if (this.view.code && this.view.status === 'connected') {
      if (!(await this.enqueue({ op: 'leave', code: this.view.code })))
        return false;
    }
    this.generation++;
    this.dropChannel();
    this.view = this.base();
    this.update({});
    this.schedule();
    return true;
  }
}
