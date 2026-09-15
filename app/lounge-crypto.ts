// Private hands travel only in encrypted snapshots for their intended player.
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
const encode = (bytes: Uint8Array) => {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(text);
};
const decode = (text: string) =>
  Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
export async function channelIdentity() {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey'],
  );
  return {
    privateKey: pair.privateKey,
    publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
  };
}
export async function channelKey(privateKey: CryptoKey, publicKey: JsonWebKey) {
  const key = await crypto.subtle.importKey(
    'jwk',
    publicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: key },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function seal(key: CryptoKey, value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    bytes = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(value)),
    );
  return {
    v: 1,
    type: 'sealed',
    iv: encode(iv),
    data: encode(new Uint8Array(bytes)),
  };
}
export async function unseal(
  key: CryptoKey,
  value: { iv: string; data: string },
) {
  if (
    typeof value.iv !== 'string' ||
    value.iv.length !== 16 ||
    typeof value.data !== 'string' ||
    value.data.length > 125000
  )
    throw new Error('Invalid packet');
  return JSON.parse(
    decoder.decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: decode(value.iv) },
        key,
        decode(value.data),
      ),
    ),
  );
}
