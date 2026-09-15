import { ACTORS } from './theater-data.ts';
import { readLounge, type LoungeSave } from './lounge-look.ts';
export const ACCOUNT_IDS = [
  'dowon',
  'gangjae',
  'minseo',
  'seungjun',
  'minjae',
  'jaemin',
  'hohyeon',
] as const;
export const ACCOUNTS = ACCOUNT_IDS.map((username, actor) => ({
  username,
  actor,
  name: ACTORS[actor],
}));
export type AccountProfile = {
  id: string;
  username: string;
  actor: number;
  save: LoungeSave | null;
  revision: number;
  updatedAt: string;
};
export function accountSave(value: unknown, actor: number): LoungeSave {
  const s = readLounge(JSON.stringify(value));
  return { ...s, actor, saved: s.saved.filter((c) => c.actor === actor) };
}
export function validPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 10 &&
    value.length <= 72 &&
    new TextEncoder().encode(value).length <= 72 &&
    /\S/.test(value)
  );
}
