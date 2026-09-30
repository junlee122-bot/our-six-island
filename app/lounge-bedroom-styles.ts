// Room wall and floor styles: swatch colours (the 3D room and the shop
// counters) and their Korean names. Pure data, no three.js.
import type { Bedroom } from './lounge-bedroom-data.ts';

export const BEDROOM_WALL_COLOR: Record<Bedroom['wall'], string> = {
  cream: '#eee6d7',
  sage: '#cbd1bd',
  blush: '#e8d3cb',
  blue: '#c9d8d6',
  mint: '#d3e8df',
  dusk: '#a9a2b8',
  gold: '#e9d8b0',
  navy: '#5d6b86',
  rose: '#d7b3b5',
  forest: '#8fa58c',
  silver: '#d4d8de',
  terracotta: '#d39a7c',
  velvet: '#4a3d63',
};
export const BEDROOM_FLOOR_COLOR: Record<Bedroom['floor'], string> = {
  oak: '#c3a579',
  walnut: '#8d7057',
  pale: '#e0d1b7',
  ash: '#cfc7bb',
  marble: '#e8e4dd',
  herringbone: '#a8825a',
  cherry: '#9b5a45',
  ebony: '#4a3a32',
};
export const WALL_NAMES: Record<Bedroom['wall'], string> = {
  cream: '크림',
  sage: '세이지',
  blush: '연분홍',
  blue: '하늘색',
  mint: '민트',
  dusk: '밤보라',
  gold: '샴페인 골드',
  navy: '밤바다 남색',
  rose: '로즈 스모크',
  forest: '깊은 숲',
  silver: '달빛 은색',
  terracotta: '노을 테라코타',
  velvet: '별밤 벨벳',
};
export const FLOOR_NAMES: Record<Bedroom['floor'], string> = {
  oak: '내추럴 오크',
  walnut: '짙은 월넛',
  pale: '밝은 나무',
  ash: '회색 애쉬',
  marble: '대리석',
  herringbone: '헤링본',
  cherry: '체리목',
  ebony: '흑단',
};
