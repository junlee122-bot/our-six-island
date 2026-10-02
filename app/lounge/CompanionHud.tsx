'use client';
// 주민 동행 HUD (design-npc-companion.md 1-6): the chip beside the mood face —
// the companion's face, their effect in one line, the time left and 보내기
// (and 냐모's bank, 신이치's hint, the realty couple's news). It also keeps
// the scenes' companion store in step with the life view (who walks with
// whom, my companion's last event) and says the parting line when an outing
// ends (보내기, the clock, the shop's opening, logging out).
import { useEffect, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { NPCS } from '../lounge-npc-data';
import { COMPANION_EFFECTS, COMPANION_END_TEXT } from '../lounge-companion-data';
import { companionPartLine } from '../lounge-npc-companion-lines';
import { setCompanionScene } from '../lounge-companion-scene';
import { VILLAGE_DISTRICTS } from '../lounge-village-layout';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { NpcPortrait } from './NpcPortrait';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import './companion.css';

const DISTRICT_NAME: Record<string, string> = Object.fromEntries(VILLAGE_DISTRICTS.map((d) => [d.id, d.name]));
/** "32분", "1분" (real minutes left; at least one). */
const minutesLeft = (ms: number) => `${Math.max(1, Math.ceil(ms / 60_000))}분`;

export function CompanionHud({ room, view, notify, onTalk, onBank }: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  /** Opens the companion talk (same as E beside them). */
  onTalk: () => void;
  /** 냐모 along: the bank window from anywhere. */
  onBank: () => void;
}) {
  const now = useNow(true, 15_000) + view.clockOffset;
  const c = view.life?.companion;
  const me = view.players.find((p) => p.id === view.self);
  const myName = me ? ACTORS[me.actor] ?? '친구' : '친구';
  const [busy, setBusy] = useState(false);
  // The scenes draw everyone's companion beside them (lounge-companion-scene.ts).
  useEffect(() => {
    setCompanionScene({
      all: Object.fromEntries(Object.entries(c?.all ?? {}).map(([uid, x]) => [uid, { actor: x.actor, npc: x.npc, until: x.until }])),
      self: view.self ?? null,
      me: myName,
      ev: c?.me.ev ?? null,
    });
  }, [c, view.self, myName]);
  // The parting line, once per parting (and not for one that ended before this tab saw it).
  const seen = useRef<string | null>(null);
  const last = c?.me.last;
  useEffect(() => {
    if (!last) return;
    const key = `${last.npc}:${last.at}`;
    if (seen.current === null) {
      seen.current = key;
      return;
    }
    if (seen.current === key) return;
    seen.current = key;
    const love = !!view.life?.me.npcRelations.find((r) => r.npc === last.npc)?.love;
    const line = companionPartLine(last.npc, { love, me: myName, now: last.at, end: last.end });
    notify(`${NPCS[last.npc].name}: “${line}” · ${COMPANION_END_TEXT[last.end]}`, 'info');
  }, [last, myName, notify, view.life]);
  useEffect(() => {
    if (seen.current === null && c) seen.current = last ? `${last.npc}:${last.at}` : '';
  }, [c, last]);

  const out = c?.me.out;
  if (!out || out.until <= now) return null;
  const npc = out.npc;
  const effect = COMPANION_EFFECTS[npc];
  const spawn = view.life?.me.spawns.find((s) => s.kind === 'forage' && !s.taken);
  const hint =
    npc === 'shinichi' && spawn
      ? `추리: ${DISTRICT_NAME[spawn.district] ?? '근처'} 쪽에 아직 아무도 안 주운 게 있어`
      : effect.kind === 'realty'
        ? '부동산 소식: 오늘의 가구는 나무결 가구점에서'
        : null;
  const dismiss = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await room.life({ kind: 'companion', op: 'dismiss' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="l-companion-hud" data-testid="companion-hud" data-npc={npc}>
      <button type="button" className="l-companion-chip" onClick={onTalk} title={`${NPCS[npc].name}에게 말 걸기`}>
        <span className="l-companion-face" aria-hidden="true">
          <NpcPortrait npc={npc} />
        </span>
        <span className="l-companion-text">
          <strong>
            {josa(NPCS[npc].name, '과/와')} 동행 · {minutesLeft(out.until - now)}
          </strong>
          <small>
            {effect.activity} · {effect.text}
          </small>
          {hint && <small className="l-companion-hint">{hint}</small>}
        </span>
      </button>
      {effect.kind === 'bank' && (
        <button type="button" className="l-companion-act" onClick={onBank} data-testid="companion-bank">
          은행
        </button>
      )}
      <button type="button" className="l-companion-act" onClick={() => void dismiss()} disabled={busy} data-testid="companion-dismiss">
        보내기
      </button>
    </span>
  );
}
