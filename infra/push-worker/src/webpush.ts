// Minimal Web Push sender for Cloudflare Workers — Web Crypto only (the Node `web-push`
// lib doesn't run in Workers). Implements RFC 8291 (aes128gcm) + RFC 8292 (VAPID).
// The encryption path is standard but can only be truly verified on a real device;
// the on-device step in docs/PUSH-SETUP.md confirms delivery.

export interface Vapid { publicKey: string; privateKey: string; subject: string } // b64url keys
export interface WebSub { endpoint: string; keys: { p256dh: string; auth: string } }

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
function bytesToB64url(b: Uint8Array): string {
  let s = '';
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
// TS 5.7 types byte arrays as Uint8Array<ArrayBufferLike>, which isn't assignable to the
// Web Crypto BufferSource param; a runtime-noop cast keeps the correct values.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', bs(ikm), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: bs(salt), info: bs(info) }, key, len * 8);
  return new Uint8Array(bits);
}

async function vapidJwt(aud: string, vapid: Vapid): Promise<string> {
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = bytesToB64url(enc.encode(JSON.stringify({ aud, exp, sub: vapid.subject })));
  const signingInput = `${header}.${payload}`;

  const pub = b64urlToBytes(vapid.publicKey); // 0x04 | x(32) | y(32)
  const jwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256', ext: true,
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: vapid.privateKey,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, bs(enc.encode(signingInput))));
  return `${signingInput}.${bytesToB64url(sig)}`; // Web Crypto returns raw r||s = JOSE
}

export async function sendPush(sub: WebSub, payload: string, vapid: Vapid, ttl = 2_419_200): Promise<Response> {
  const uaPublic = b64urlToBytes(sub.keys.p256dh); // 65
  const auth = b64urlToBytes(sub.keys.auth); // 16

  const as = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey)); // 65
  const uaKey = await crypto.subtle.importKey('raw', bs(uaPublic), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));

  // IKM = HKDF-Expand(HKDF-Extract(auth, ecdh), "WebPush: info\0"|ua|as, 32)
  const ikm = await hkdf(auth, ecdh, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const aesKey = await crypto.subtle.importKey('raw', bs(cek), 'AES-GCM', false, ['encrypt']);
  const record = concat(enc.encode(payload), new Uint8Array([0x02])); // single-record delimiter
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bs(nonce), tagLength: 128 }, aesKey, bs(record)));

  // header: salt(16) | rs(uint32 BE) | idlen(1) | as_public(65)
  const headBuf = new ArrayBuffer(16 + 4 + 1 + 65);
  const head = new Uint8Array(headBuf);
  head.set(salt, 0);
  new DataView(headBuf).setUint32(16, 4096, false);
  head[20] = asPublic.length;
  head.set(asPublic, 21);
  const body = concat(head, cipher);

  const jwt = await vapidJwt(new URL(sub.endpoint).origin, vapid);
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
    },
    body: body as unknown as BodyInit,
  });
}
