// What I can give a resident right now, from my life view: bag items (not
// tools), crops (any quality, and 금별 crops as their own choice) and fruit.
// Used by the notebook's select and the speech box's gift picker.
import type { LifeView } from '../lounge-life';
import { CROPS, CROP_INFO } from '../lounge-life';
import { itemName } from '../lounge-life-plus';
import { npcGiftable } from '../lounge-romance';

export type GiftOption = {
  key: string;
  item: string;
  q: 0 | 2;
  n: number;
  /** "금별 당근" (the speech box's picker). */
  name: string;
  /** "금별 당근 · 2개" (the notebook's select). */
  label: string;
};
export function giftOptions(life: LifeView | null | undefined): GiftOption[] {
  if (!life) return [];
  const me = life.me;
  const out: GiftOption[] = [];
  for (const crop of CROPS) {
    const n = me.bag.produce[crop] ?? 0;
    if (n > 0) out.push({ key: crop, item: crop, q: 0, n, name: CROP_INFO[crop].name, label: `${CROP_INFO[crop].name} · ${n}개` });
    const gold = me.quality?.gold?.[crop] ?? 0;
    if (gold > 0) out.push({ key: crop + ':2', item: crop, q: 2, n: gold, name: `금별 ${CROP_INFO[crop].name}`, label: `금별 ${CROP_INFO[crop].name} · ${gold}개` });
  }
  if ((me.bag.fruit ?? 0) > 0) out.push({ key: 'fruit', item: 'fruit', q: 0, n: me.bag.fruit, name: '과일', label: `과일 · ${me.bag.fruit}개` });
  for (const [id, n] of Object.entries(me.inv ?? {}))
    if (n > 0 && npcGiftable(id)) out.push({ key: id, item: id, q: 0, n, name: itemName(id), label: `${itemName(id)} · ${n}개` });
  return out;
}
