// "혼자 할 수 있는 것": what the invite window suggests when nobody else is
// online (every table game needs two or more people). Pure: the invite window
// renders the list and lounge-game.tsx runs the chosen one.

export type SoloKind = 'farm' | 'fish' | 'museum' | 'requests' | 'decorate';

export type SoloActivity = {
  kind: SoloKind;
  title: string;
  detail: string;
  /** Something is waiting there right now (ripe crops, open requests). */
  hot: boolean;
};

type SoloLife = {
  me: {
    farm?: readonly { crop: unknown; ready?: boolean }[];
    requests?: readonly { done?: boolean }[];
  };
} | null;

export function soloActivities(
  life: SoloLife | undefined,
  actionKey = 'E',
): SoloActivity[] {
  const farm = life?.me.farm ?? [];
  const ripe = farm.filter((plot) => plot.crop && plot.ready).length;
  const empty = farm.filter((plot) => !plot.crop).length;
  const open = (life?.me.requests ?? []).filter((r) => !r.done).length;
  return [
    {
      kind: 'farm',
      title: '내 텃밭 돌보기',
      detail: ripe
        ? `수확할 작물 ${ripe}개가 기다려요`
        : empty
          ? `빈 칸 ${empty}곳에 씨앗을 심어요`
          : '물 주고 자라는 걸 지켜봐요',
      hot: ripe > 0,
    },
    {
      kind: 'requests',
      title: '오늘의 부탁',
      detail: open ? `친구들의 부탁 ${open}개가 남았어요` : '오늘 부탁은 다 들어줬어요',
      hot: open > 0,
    },
    {
      kind: 'fish',
      title: '연못에서 낚시',
      detail: `낚싯대를 들고 연못가에서 ${actionKey}`,
      hot: false,
    },
    {
      kind: 'museum',
      title: '마을 박물관',
      detail: '모은 물고기와 작물을 기증해요',
      hot: false,
    },
    {
      kind: 'decorate',
      title: '내 방 꾸미기',
      detail: '가구를 옮기고 새 소품을 놓아요',
      hot: false,
    },
  ];
}

/** Online friends besides me (the picker is "alone" at 0). */
export function othersOnline(
  players: readonly { id: string }[],
  self: string,
): number {
  return players.filter((p) => p.id !== self).length;
}
