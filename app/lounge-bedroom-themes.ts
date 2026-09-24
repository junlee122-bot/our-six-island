import type { Bedroom, RoomPropId } from './lounge-bedroom-data.ts';

export const BEDROOM_THEMES = [
  {
    title: '미쿠 스튜디오',
    tag: 'MIKU / 01',
    description: '레코드와 피규어, 음악이 있는 작은 컬렉션 룸.',
    accent: '#79b9a5',
    paper: '#d8e7d8',
    wall: 'blush',
    floor: 'oak',
    props: [
      'miku-poster',
      'miku-records',
      'miku-banner',
      'miku-acrylic',
      'miku-light-stick',
      'miku-headphones',
      'miku-cushion',
      'miku-desk-mat',
    ],
  },
  {
    title: '우드 리스닝룸',
    tag: 'SLOW SIDE A',
    description: '낮은 조명과 나무 가구, 좋아하는 음악을 듣는 자리.',
    accent: '#927d67',
    paper: '#e6d5b8',
    wall: 'cream',
    floor: 'walnut',
    props: ['record-player', 'speaker', 'books', 'music-poster', 'tea-set'],
  },
  {
    title: '초록 온실방',
    tag: 'LITTLE BOTANICAL',
    description: '햇살을 받는 식물과 꽃, 초록빛으로 채운 작업실.',
    accent: '#819a6b',
    paper: '#dce2c3',
    wall: 'sage',
    floor: 'pale',
    props: ['plant', 'flowers', 'plant', 'photo-string', 'bunny-plush'],
  },
  {
    title: '오후의 서재',
    tag: 'ONE MORE PAGE',
    description: '책장과 편안한 의자, 조용히 쉬어 가는 오후.',
    accent: '#728f9a',
    paper: '#d9e5e2',
    wall: 'blue',
    floor: 'oak',
    props: ['books', 'books', 'tea-set', 'wall-clock', 'instant-camera'],
  },
  {
    title: '밤빛 레코드룸',
    tag: 'AFTER HOURS',
    description: '짙은 나무와 포근한 빛이 감싸는 작은 음악 감상실.',
    accent: '#9e7a82',
    paper: '#e7d3cd',
    wall: 'blush',
    floor: 'walnut',
    props: [
      'record-player',
      'speaker',
      'star-lights',
      'music-poster',
      'heart-cushion',
    ],
  },
  {
    title: '여행자의 아지트',
    tag: 'POSTCARDS HOME',
    description: '사진과 여행의 조각들을 모아 둔 밝은 아지트.',
    accent: '#b09459',
    paper: '#e8ddbb',
    wall: 'cream',
    floor: 'pale',
    props: [
      'instant-camera',
      'photo-string',
      'books',
      'plant',
      'headband-display',
    ],
  },
  {
    title: '플레이 아틀리에',
    tag: 'NEXT ROUND',
    description: '게임 컬렉션과 작업 책상, 친구들과의 다음 판을 생각하는 방.',
    accent: '#6e9a94',
    paper: '#d1e5db',
    wall: 'sage',
    floor: 'oak',
    props: [
      'speaker',
      'twin-tail-figure',
      'headband-display',
      'star-lights',
      'cat-plush',
    ],
  },
] as const satisfies readonly {
  title: string;
  tag: string;
  description: string;
  accent: string;
  paper: string;
  wall: Bedroom['wall'];
  floor: Bedroom['floor'];
  props: readonly RoomPropId[];
}[];

export const bedroomTheme = (actor: number) =>
  BEDROOM_THEMES[actor] ?? BEDROOM_THEMES[0];

/** Original graphic wall prints, composed for each fictional room theme. */
export function bedroomThemePoster(actor: number): string {
  const theme = bedroomTheme(actor);
  const motifs = [
    '<text x="150" y="210" text-anchor="middle" font-size="100" font-family="sans-serif" fill="#e9edda">01</text>',
    '<circle cx="150" cy="179" r="78" fill="#394748"/><circle cx="150" cy="179" r="58" fill="none" stroke="#819084" stroke-width="2"/><circle cx="150" cy="179" r="26" fill="#c5b891"/><circle cx="150" cy="179" r="5" fill="#f6f1de"/>',
    '<path d="M151 264V115M150 180Q91 97 75 145Q82 197 149 201M151 161Q212 79 225 128Q221 178 152 186M151 237Q100 196 88 227Q105 258 151 256" fill="#718e60" stroke="#536b4c" stroke-width="5"/><path d="M119 264H183L174 293H128Z" fill="#b99871"/>',
    '<path d="M65 134Q106 115 149 142Q192 115 236 134V242Q192 222 149 248Q106 222 65 242Z" fill="#f4edda" stroke="#6b8490" stroke-width="5"/><path d="M149 144V246M82 159L129 158M82 180L129 182M82 203L129 203M169 159L217 155M169 180L217 178M169 203L217 200" stroke="#99acaa" stroke-width="3"/>',
    '<circle cx="150" cy="183" r="74" fill="#404655"/><circle cx="150" cy="183" r="25" fill="#ccaaa5"/><path d="M197 78Q148 94 169 125Q215 128 219 84" fill="#efe4c7"/><path d="M76 91V119M62 105H90M233 246V269M221 258H246" stroke="#efe4c7" stroke-width="4"/>',
    '<rect x="55" y="123" width="190" height="134" rx="5" fill="#f2eddc" transform="rotate(-9 150 190)"/><path d="M67 224L108 159L150 205L184 156L238 226Z" fill="#89a38b"/><circle cx="201" cy="140" r="19" fill="#d0b877"/><path d="M72 269H153M71 282H117" stroke="#9d8e6e" stroke-width="4"/>',
    '<path d="M102 120H198L226 214Q234 246 213 246L175 215H125L90 246Q65 249 75 215Z" fill="#f0ead8" stroke="#597d78" stroke-width="5"/><path d="M112 151V192M92 172H132" stroke="#647f7a" stroke-width="12"/><circle cx="183" cy="159" r="9" fill="#c39891"/><circle cx="205" cy="181" r="9" fill="#89ad9c"/>',
  ];
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect x="7" y="7" width="286" height="386" rx="4" fill="#8f7a5d"/><rect x="15" y="15" width="270" height="370" fill="${theme.paper}"/><rect x="30" y="75" width="240" height="240" rx="110" fill="${theme.accent}" opacity=".23"/>${motifs[actor] ?? motifs[0]}<text x="150" y="50" text-anchor="middle" font-family="sans-serif" font-size="12" letter-spacing="3" fill="#526355">${theme.tag}</text><path d="M42 334H258" stroke="#b3ad94"/><text x="150" y="362" text-anchor="middle" font-family="sans-serif" font-size="10" letter-spacing="4" fill="#817862">BEOMDEW ATELIER</text></svg>`,
    )
  );
}
