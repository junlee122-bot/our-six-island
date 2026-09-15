import {
  newLoungeLedger,
  readLoungeLedger,
  validateLedger,
  voidGame,
  type LoungeLedger,
} from './lounge-economy.ts';
export const BEOM_STORAGE_KEY = 'hohyeon-beom-ledger-v1';
const encoder = new TextEncoder();
const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
const signing = { name: 'ECDSA', hash: 'SHA-256' };
const b64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
const unb64 = (s: string) =>
  Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
    c.charCodeAt(0),
  );
export type WalletIdentity = {
  id: string;
  key: JsonWebKey;
  privateKey: CryptoKey;
};
export type WalletProof = { key: JsonWebKey; signature: string };
export function acquireHouseLock(): Promise<() => void> {
  if (typeof window === 'undefined') return Promise.resolve(() => {});
  if (!navigator.locks)
    return Promise.reject(
      new Error(
        '범 지갑에는 최신 브라우저가 필요합니다. Chrome 또는 Edge에서 열어 주세요.',
      ),
    );
  return new Promise((resolve, reject) => {
    void navigator.locks
      .request('hohyeon-beom-host-v1', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(
            new Error(
              '이 브라우저의 다른 탭에서 방을 열고 있어요. 먼저 그 방을 닫아 주세요.',
            ),
          );
          return;
        }
        await new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
async function identity(pair: CryptoKeyPair): Promise<WalletIdentity> {
  if (
    !pair?.privateKey ||
    pair.privateKey.type !== 'private' ||
    !pair.publicKey
  )
    throw new Error('저장된 지갑 키를 읽을 수 없습니다.');
  const key = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { id: await walletId(key), key, privateKey: pair.privateKey };
}
async function walletId(key: JsonWebKey) {
  if (
    key.kty !== 'EC' ||
    key.crv !== 'P-256' ||
    typeof key.x !== 'string' ||
    typeof key.y !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(key.x) ||
    !/^[A-Za-z0-9_-]{43}$/.test(key.y)
  )
    throw new Error('지갑 공개키가 올바르지 않습니다.');
  return (
    'wallet-' +
    b64(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          encoder.encode(`beom:P-256:${key.x}:${key.y}`),
        ),
      ),
    )
  );
}
export async function loadWalletIdentity(): Promise<WalletIdentity> {
  const candidate = await crypto.subtle.generateKey(algorithm, false, [
    'sign',
    'verify',
  ]);
  if (typeof indexedDB === 'undefined') return identity(candidate);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('hohyeon-beom-wallet-v1', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('identity');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          '지갑을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.',
        ),
      );
    request.onblocked = () =>
      reject(new Error('다른 창의 지갑 작업이 끝나면 다시 참가해 주세요.'));
  });
  try {
    const pair = await new Promise<CryptoKeyPair>((resolve, reject) => {
      const tx = db.transaction('identity', 'readwrite'),
        store = tx.objectStore('identity');
      let value: CryptoKeyPair;
      const read = store.get('key');
      read.onsuccess = () => {
        value = read.result === undefined ? candidate : read.result;
        if (read.result === undefined) store.add(candidate, 'key');
      };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(new Error('지갑 키 저장에 실패했습니다.'));
      tx.onabort = () => reject(new Error('지갑 키 저장이 취소됐습니다.'));
    });
    return await identity(pair);
  } finally {
    db.close();
  }
}
const proofBody = (room: string, peer: string, nonce: string) =>
  encoder.encode(JSON.stringify(['beom-join-v1', room, peer, nonce]));
export async function proveWallet(
  wallet: WalletIdentity,
  room: string,
  peer: string,
  nonce: string,
): Promise<WalletProof> {
  const signature = await crypto.subtle.sign(
    signing,
    wallet.privateKey,
    proofBody(room, peer, nonce),
  );
  return { key: wallet.key, signature: b64(new Uint8Array(signature)) };
}
export async function verifyWallet(
  proof: WalletProof,
  room: string,
  peer: string,
  nonce: string,
): Promise<string | null> {
  try {
    if (
      !proof ||
      typeof proof.signature !== 'string' ||
      !/^[A-Za-z0-9_-]{86}$/.test(proof.signature)
    )
      return null;
    const id = await walletId(proof.key);
    const key = await crypto.subtle.importKey(
      'jwk',
      proof.key,
      algorithm,
      false,
      ['verify'],
    );
    return (await crypto.subtle.verify(
      signing,
      key,
      unb64(proof.signature),
      proofBody(room, peer, nonce),
    ))
      ? id
      : null;
  } catch {
    return null;
  }
}
export class LoungeBank {
  ledger: LoungeLedger;
  private raw: string | null;
  private storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  constructor(
    storage: Pick<
      Storage,
      'getItem' | 'setItem'
    > | null = typeof localStorage === 'undefined' ? null : localStorage,
  ) {
    this.storage = storage;
    this.raw = storage?.getItem(BEOM_STORAGE_KEY) ?? null;
    this.ledger = readLoungeLedger(this.raw) ?? newLoungeLedger();
  }
  commit(next: LoungeLedger) {
    validateLedger(next);
    if (next === this.ledger) return;
    if (this.storage && this.storage.getItem(BEOM_STORAGE_KEY) !== this.raw)
      throw new Error(
        '다른 창에서 범 지갑이 바뀌었습니다. 방을 다시 열어 주세요.',
      );
    const raw = JSON.stringify(next);
    // Storage failure leaves both the ledger and the caller's game unchanged.
    this.storage?.setItem(BEOM_STORAGE_KEY, raw);
    this.raw = raw;
    this.ledger = next;
  }
  recover() {
    let next = this.ledger;
    for (const [id, g] of Object.entries(next.games))
      if (g.state === 'reserved') next = voidGame(next, id);
    this.commit(next);
  }
  view(wallet: string | undefined) {
    if (!wallet)
      return {
        balance: 0,
        held: 0,
        history: [] as { id: string; game: string; delta: number }[],
      };
    let held = 0;
    const history: { id: string; game: string; delta: number }[] = [];
    for (const [id, g] of Object.entries(this.ledger.games)) {
      const i = g.wallets.indexOf(wallet);
      if (i < 0) continue;
      if (g.state === 'reserved') held += g.deposits[i];
      else history.push({ id, game: g.game, delta: g.result[i] });
    }
    return {
      balance: this.ledger.accounts[wallet] ?? 0,
      held,
      history: history.slice(-8).reverse(),
    };
  }
}
