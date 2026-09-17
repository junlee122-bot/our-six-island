import {
  emptyLoungeView,
  type LoungeView,
  type LoungeWorld,
  type LoungeAction,
} from './lounge-room';
import { cloud, cloudCall, AccountError } from './lounge-auth';
import type { AccountProfile } from './lounge-accounts';
import type { CloudCommand } from './lounge-cloud-engine';
import type { Look } from './lounge-look';
import { roomCode } from './multiplayer-protocol';
import { receiveReaction } from './lounge-reactions';
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
};
export class CloudRoom {
  private view = emptyLoungeView();
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
  activeRoom: string | null = null;
  private account: AccountProfile;
  constructor(account: AccountProfile) {
    this.account = account;
    this.view = { ...this.view, self: account.id };
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.view;
  private update(p: Partial<LoungeView>) {
    this.view = { ...this.view, ...p };
    for (const fn of this.listeners) fn();
  }
  init() {
    this.stopped = false;
    void this.refresh();
  }
  dispose() {
    this.stopped = true;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    if (this.moveTimer) clearTimeout(this.moveTimer);
    void this.channel?.unsubscribe();
    this.channel = null;
  }
  private schedule(ms = 8000) {
    if (this.timer) clearTimeout(this.timer);
    if (!this.stopped)
      this.timer = setTimeout(() => void this.refresh(), Math.max(250, ms));
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
      this.update({
        ...r.packet,
        players,
        self: this.account.id,
        code: r.code,
        role: r.host === this.account.id ? 'host' : 'guest',
        status: 'connected',
        claiming: null,
        error: r.ok ? '' : r.error,
      });
      if (!this.channel) {
        this.channel = cloud
          .channel('hh-cloud-' + r.code)
          .on('broadcast', { event: 'revision' }, () => this.schedule(80))
          .subscribe();
      }
    } else {
      this.update({ wallet: r.wallet, ...(!r.ok ? { error: r.error } : {}) });
      if (
        this.view.status === 'connected' &&
        (r.status === 409 || r.status === 404)
      ) {
        void this.channel?.unsubscribe();
        this.channel = null;
        this.update({
          ...emptyLoungeView(),
          self: this.account.id,
          wallet: r.wallet,
          status: 'error',
          error: r.error,
        });
      }
    }
    this.schedule(
      r.nextDue ? Math.min(8000, r.nextDue - r.serverNow + 150) : 8000,
    );
  }
  private async send(command: CloudCommand, generation: number) {
    let result: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await cloudCall<Response>(
          'hohyeon-api',
          {
            op: 'world',
            command,
          },
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
        this.update({
          error: e instanceof Error ? e.message : '연결을 확인해 주세요.',
        });
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
    const task = this.queue.then(async () => {
      if (this.stopped || g !== this.generation) return false;
      try {
        return (await this.send(body, g)).ok;
      } catch (e) {
        if (g === this.generation)
          this.update({
            error: e instanceof Error ? e.message : '요청을 처리하지 못했어요.',
          });
        return false;
      }
    });
    this.queue = task;
    return task;
  }
  async start(
    role: 'host' | 'guest',
    input: string,
    _actor: number,
    look: Look,
  ) {
    if (this.view.status === 'connecting') return;
    const generation = this.generation;
    let code = '';
    if (role === 'guest') {
      try {
        code =
          roomCode(input) ||
          roomCode(new URL(input).hash.replace(/^#lounge=/, '')) ||
          '';
      } catch {
        code = roomCode(input) || '';
      }
      if (!code) {
        this.update({ error: '10자리 초대 코드나 초대 링크를 입력해 주세요.' });
        return;
      }
    }
    this.update({ status: 'connecting', error: '' });
    try {
      await this.send({ op: 'wallet' }, this.generation);
      if (generation !== this.generation || this.stopped) return;
    } catch (e) {
      this.update({
        status: 'error',
        error: e instanceof Error ? e.message : '연결하지 못했어요.',
      });
      return;
    }
    if (
      !(await this.enqueue({
        op: role === 'host' ? 'open' : 'join',
        code,
        look,
        epoch: this.epoch,
      }))
    )
      this.update({ status: 'error' });
  }
  claim(_actor: number, look: Look) {
    return this.start('guest', this.view.code, this.account.actor, look);
  }
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
    void this.channel?.unsubscribe();
    this.channel = null;
    this.update({
      ...emptyLoungeView(),
      self: this.account.id,
      wallet: this.view.wallet,
    });
    this.schedule();
    return true;
  }
}
