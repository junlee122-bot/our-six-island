import { accountSave } from './lounge-accounts.ts';
import type { LoungeSave } from './lounge-look.ts';

export type AccountDraft = {
  value: unknown;
  save: LoungeSave;
};

export function readAccountDraft(
  raw: string,
  actor: number,
  current: LoungeSave,
): AccountDraft {
  const value: unknown = JSON.parse(raw);
  return { value, save: accountSave(value, actor, current) };
}

export function restoreAccountDraft(
  draft: AccountDraft,
  actor: number,
  current: LoungeSave,
): LoungeSave {
  // Keep field absence until restoration so a legacy outfit draft preserves
  // the latest bedroom, including edits made after the restore notice appeared.
  return accountSave(draft.value, actor, current);
}
