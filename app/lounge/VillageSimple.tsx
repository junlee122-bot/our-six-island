'use client';
import { useEffect, useState } from 'react';
import {
  Apple,
  Backpack,
  DoorOpen,
  House,
  Mail,
  MessageCircle,
  Sprout,
  Store,
  Trees,
} from 'lucide-react';
import { AvatarView } from '../avatar-view';
import type { LoungePlayer } from '../lounge-room';
import {
  VILLAGE_PLACES,
  type VillageDestination,
  type VillagePlace,
} from '../lounge-village-layout';
import { villageCanEnterPlace } from '../lounge-village-entrance';
import { npcLine } from '../lounge-village-life';
import { FRUIT_TREES, plotStage, type LifeView } from '../lounge-life';
import { ACTORS } from '../lounge-roster';
import { NAMES } from '../lounge-text';
import { lookFor, rememberLook } from './friend-looks';
import { useServerClock } from './use-server-clock';

/** Phones and tablets: prompts say "눌러서" instead of "E로". */
export function isTouchDevice() {
  try {
    return (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(hover: none) and (pointer: coarse)').matches
    );
  } catch {
    return false;
  }
}

function remaining(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}시간 ${minutes % 60 ? (minutes % 60) + '분' : ''}`.trim()
    : `${minutes}분`;
}

export type VillageLifeHandlers = {
  life?: LifeView | null;
  clockOffset?: number;
  onFarm?: () => void;
  onShop?: () => void;
  onBag?: () => void;
  onMail?: () => void;
  onPick?: (tree: string) => void;
  onVisit?: (actor: number) => void;
};

/**
 * The daily life loop as a plain list: farm, fruit trees (with cooldowns),
 * the shop, the mailbox, friends' houses and a word with offline friends.
 * Used by "간단 그래픽" and when the 3D village cannot start (WebGL).
 */
export function VillageLifeList({
  actor,
  life,
  clockOffset = 0,
  onFarm,
  onShop,
  onBag,
  onMail,
  onPick,
  onVisit,
  online = [],
}: VillageLifeHandlers & { actor: number; online?: number[] }) {
  const readyTimes = [
    ...(life?.me.farm.map((p) => p.readyAt) ?? []),
    ...FRUIT_TREES.map((t) => life?.me.fruitReadyAt?.[t] ?? 0),
  ];
  const now = useServerClock(clockOffset, readyTimes);
  const [talk, setTalk] = useState<{ actor: number; text: string } | null>(null);
  const farm = life?.me.farm ?? [];
  const ready = farm.filter((p) => p.crop && plotStage(p, now) === 3).length;
  const empty = farm.filter((p) => !p.crop).length;
  const unread = life?.me.mailUnread ?? 0;
  const friends = ACTORS.map((name, a) => ({ name, actor: a })).filter(
    (f) => f.actor !== actor,
  );
  return (
    <div className="l-simple-life" data-testid="village-life-list">
      <h2>범타듀의 하루</h2>
      <div className="l-simple-places">
        {onFarm && (
          <button onClick={onFarm} data-testid="simple-farm">
            <Sprout size={18} aria-hidden="true" />
            <span>
              <strong>{ACTORS[actor]}의 텃밭</strong>
              <small>
                {!life
                  ? '마을에 연결되면 돌볼 수 있어요'
                  : ready
                    ? `수확할 작물 ${ready}개`
                    : empty
                      ? `빈 밭 ${empty}칸`
                      : '쑥쑥 자라는 중'}
              </small>
            </span>
          </button>
        )}
        {onShop && (
          <button onClick={onShop} data-testid="simple-shop">
            <Store size={18} aria-hidden="true" />
            <span>
              <strong>범타듀 상점</strong>
              <small>씨앗 · 희귀 소품 · 머리색 팔레트</small>
            </span>
          </button>
        )}
        {onBag && (
          <button onClick={onBag}>
            <Backpack size={18} aria-hidden="true" />
            <span>
              <strong>가방</strong>
              <small>수확물 팔기</small>
            </span>
          </button>
        )}
        {onMail && (
          <button onClick={onMail}>
            <Mail size={18} aria-hidden="true" />
            <span>
              <strong>우편함{unread ? ` (${unread})` : ''}</strong>
              <small>편지 · 방명록</small>
            </span>
          </button>
        )}
      </div>
      {onPick && (
        <>
          <h3>과일나무</h3>
          <ul className="l-simple-trees">
            {FRUIT_TREES.map((tree, i) => {
              const at = life?.me.fruitReadyAt?.[tree] ?? 0;
              const ripe = !!life && (!at || at <= now);
              return (
                <li key={tree}>
                  <button
                    disabled={!ripe}
                    onClick={() => onPick(tree)}
                    data-testid={`simple-pick-${tree}`}
                  >
                    <Apple size={16} aria-hidden="true" /> {i + 1}번 나무
                    <small>
                      {!life ? '연결 중' : ripe ? '따기' : `${remaining(at - now)} 뒤`}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {onVisit && (
        <>
          <h3>친구 집 놀러 가기</h3>
          <ul className="l-simple-homes">
            {friends.map((f) => (
              <li key={f.actor}>
                <button
                  onClick={() => onVisit(f.actor)}
                  data-testid={`simple-visit-${f.actor}`}
                >
                  <House size={15} aria-hidden="true" /> {f.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>산책 중인 친구에게 말 걸기</h3>
      <ul className="l-simple-homes">
        {friends
          .filter((f) => !online.includes(f.actor))
          .map((f) => (
            <li key={f.actor}>
              <button
                aria-pressed={talk?.actor === f.actor}
                onClick={() => {
                  const status = Object.values(life?.statuses ?? {}).find(
                    (s) => s.actor === f.actor,
                  );
                  setTalk({ actor: f.actor, text: npcLine(f.actor, status?.text, now) });
                }}
                data-testid={`simple-talk-${f.actor}`}
              >
                <MessageCircle size={15} aria-hidden="true" /> {f.name}
              </button>
            </li>
          ))}
      </ul>
      {talk && (
        <output className="l-simple-talk">
          <span aria-hidden="true">
            <AvatarView actor={talk.actor} look={lookFor(talk.actor)} portrait />
          </span>
          <span>
            <b>{ACTORS[talk.actor]}</b> “{talk.text}”
          </span>
        </output>
      )}
    </div>
  );
}

/** "간단 그래픽" village: a light 2D guide board instead of the 3D scene. */
export function VillageSimple({
  actor,
  players,
  self,
  onEnter,
  onChat,
  ...life
}: {
  actor: number;
  players: LoungePlayer[];
  self: string;
  onEnter: (destination: VillageDestination, place: VillagePlace) => void;
  onChat?: () => void;
} & VillageLifeHandlers) {
  const places = VILLAGE_PLACES.filter((place) =>
    villageCanEnterPlace(place, actor),
  );
  const here = players.filter(
    (p) => (p.area as string) === 'village' && p.id !== self,
  );
  useEffect(() => {
    for (const p of players) rememberLook(p.actor, p.look);
  }, [players]);
  return (
    <section
      className="l-simple-village"
      aria-labelledby="l-simple-village-title"
    >
      <header>
        <Trees size={28} aria-hidden="true" />
        <div>
          <h1 id="l-simple-village-title">{NAMES.app} 안내판</h1>
          <p>가고 싶은 곳을 눌러 바로 들어가요.</p>
        </div>
      </header>
      <div className="l-simple-places">
        {places.map((place) => (
          <button
            key={place.id}
            onClick={() => onEnter(place.destination, place)}
          >
            <i style={{ background: place.roofColor }} aria-hidden="true" />
            <span>
              <strong>{place.kind === 'home' ? NAMES.home : place.name}</strong>
              <small>{place.subtitle}</small>
            </span>
            <DoorOpen size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      <VillageLifeList
        actor={actor}
        online={players.filter((p) => !p.id.startsWith('friend-')).map((p) => p.actor)}
        {...life}
      />
      {here.length > 0 && (
        <div className="l-simple-friends">
          <h2>마을 광장</h2>
          <ul>
            {here.map((p) => (
              <li key={p.id}>
                <AvatarView actor={p.actor} look={p.look} portrait />
                {ACTORS[p.actor]}
              </li>
            ))}
          </ul>
        </div>
      )}
      {onChat && (
        <button className="l-secondary l-simple-chat" onClick={onChat}>
          <MessageCircle size={17} aria-hidden="true" />
          {NAMES.chatVillage}
        </button>
      )}
    </section>
  );
}
