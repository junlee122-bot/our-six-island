// Yuchan is appended after the original seven friends; their ids stay stable.
export const YUCHAN_ACTOR = 7;
/** One private-to-this-character atlas, never a spare cell in another friend's sheet. */
export const YUCHAN_ATLAS = { columns: 3, rows: 2, outfits: 5 } as const;
export const YUCHAN_OUTFIT_CELL: Readonly<Record<string, number>> = {
  classic: 0,
  street: 1,
  smart: 2,
  akatsuki: 3,
  maid: 4,
};
