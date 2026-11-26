/** Local table input guards. Match revisions remain authoritative on the server. */
export type TableActionTicket = { key: string; attempt: number };
export type TableActionLock = {
  current: TableActionTicket | null;
  attempt: number;
};
export const newTableActionLock = (): TableActionLock => ({
  current: null,
  attempt: 0,
});
export const tableActionKey = (match: { id: string; revision: number }) =>
  `${match.id}:${match.revision}`;
export const isTableActionPending = (lock: TableActionLock, key: string) =>
  lock.current?.key === key;

/** A new snapshot may accept input while an older request is still resolving. */
export function claimTableAction(
  lock: TableActionLock,
  key: string,
): TableActionTicket | null {
  if (isTableActionPending(lock, key)) return null;
  const ticket = { key, attempt: ++lock.attempt };
  lock.current = ticket;
  return ticket;
}

/** An old rejection must never release a newer action, even after a retry. */
export function releaseTableAction(
  lock: TableActionLock,
  ticket: TableActionTicket,
): boolean {
  if (
    lock.current?.key !== ticket.key ||
    lock.current.attempt !== ticket.attempt
  )
    return false;
  lock.current = null;
  return true;
}

/** Betting inputs are street totals; preview only the additional chips spent now. */
export function tableBetPreview(
  to: number,
  bet: number,
  stack: number,
  legal: { canRaise: boolean; minTo: number; maxTo: number },
): { additional: number; remaining: number; allIn: boolean } | null {
  if (
    !legal.canRaise ||
    ![to, bet, stack, legal.minTo, legal.maxTo].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  )
    return null;
  const additional = to - bet;
  if (
    to < legal.minTo ||
    to > legal.maxTo ||
    additional <= 0 ||
    additional > stack
  )
    return null;
  return {
    additional,
    remaining: stack - additional,
    allIn: additional === stack,
  };
}
