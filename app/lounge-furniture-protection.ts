import type { Bedroom } from './lounge-bedroom-data.ts';

export type FurniturePolicy = {
  owned?: Readonly<Record<string, number>>;
  strict?: Readonly<Record<string, true>>;
};

/** A stolen furniture ref no longer inherits a legacy room's extra copies.
 * Keep the saved placement order, and never mutate the historical profile.
 * Buying another copy raises this limit again; unrelated legacy refs remain. */
export function maskBedroomFurniture<T extends Bedroom | null>(
  room: T,
  owned: FurniturePolicy['owned'],
  strict: FurniturePolicy['strict'],
): T {
  if (!room || !strict || !Object.keys(strict).length) return room;
  const seen = new Map<string, number>();
  const items = room.items.filter((item) => {
    if (!Object.hasOwn(strict, item.ref) || strict[item.ref] !== true) return true;
    const n = (seen.get(item.ref) ?? 0) + 1;
    seen.set(item.ref, n);
    const count = owned?.[item.ref];
    return Number.isSafeInteger(count) && n <= (count ?? 0);
  });
  return items.length === room.items.length ? room : { ...room, items } as T;
}

/** Profile responses may contain a legacy/null save. Mask only readable item
 * lists; validation and version handling remain with the existing save parser. */
export function maskFurnitureSave<T>(save: T, policy: FurniturePolicy): T {
  if (!save || typeof save !== 'object' || Array.isArray(save)) return save;
  const raw = (save as { bedroom?: unknown }).bedroom;
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as Bedroom).items) ||
    (raw as Bedroom).items.some((i) => !i || typeof i.ref !== 'string')) return save;
  const bedroom = maskBedroomFurniture(raw as Bedroom, policy.owned, policy.strict);
  return bedroom === raw ? save : { ...save, bedroom };
}
