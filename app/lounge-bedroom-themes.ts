type WallColor = 'cream' | 'sage' | 'blush' | 'blue' | 'mint' | 'dusk';
type FloorKind = 'oak' | 'walnut' | 'pale' | 'ash';

export const BEDROOM_THEMES = [
  {
    id: 'miku',
    title: '미쿠 스튜디오',
    tag: '민트빛 무대',
    description: '민트빛 응원봉과 피규어, 좋아하는 노래로 채운 팬 컬렉션 룸.',
    accent: '#79b9a5',
    paper: '#d8e7d8',
    wall: 'blush',
    floor: 'oak',
  },
  {
    id: 'listening',
    title: '우드 리스닝룸',
    tag: '느긋한 A면',
    description: '낮은 조명과 나무 가구, 좋아하는 음악을 듣는 자리.',
    accent: '#927d67',
    paper: '#e6d5b8',
    wall: 'cream',
    floor: 'walnut',
  },
  {
    id: 'botanical',
    title: '초록 온실방',
    tag: '작은 식물원',
    description: '햇살을 받는 식물과 꽃, 초록빛으로 채운 작업실.',
    accent: '#819a6b',
    paper: '#dce2c3',
    wall: 'sage',
    floor: 'pale',
  },
  {
    id: 'study',
    title: '오후의 서재',
    tag: '한 장만 더',
    description: '책장과 편안한 의자, 조용히 쉬어 가는 오후.',
    accent: '#728f9a',
    paper: '#d9e5e2',
    wall: 'blue',
    floor: 'oak',
  },
  {
    id: 'records',
    title: '밤빛 레코드룸',
    tag: '늦은 밤 한 곡',
    description: '짙은 나무와 포근한 빛이 감싸는 작은 음악 감상실.',
    accent: '#9e7a82',
    paper: '#e7d3cd',
    wall: 'dusk',
    floor: 'walnut',
  },
  {
    id: 'traveler',
    title: '여행자의 아지트',
    tag: '엽서가 모이는 곳',
    description: '사진과 여행의 조각들을 모아 둔 밝은 아지트.',
    accent: '#b09459',
    paper: '#e8ddbb',
    wall: 'cream',
    floor: 'pale',
  },
  {
    id: 'play',
    title: '플레이 아틀리에',
    tag: '다음 판 준비',
    description: '게임 컬렉션과 작업 책상, 친구들과의 다음 판을 생각하는 방.',
    accent: '#6e9a94',
    paper: '#d1e5db',
    wall: 'mint',
    floor: 'ash',
  },
] as const satisfies readonly {
  id: string;
  title: string;
  tag: string;
  description: string;
  accent: string;
  paper: string;
  wall: WallColor;
  floor: FloorKind;
}[];

export const bedroomTheme = (actor: number) =>
  BEDROOM_THEMES[actor] ?? BEDROOM_THEMES[0];
