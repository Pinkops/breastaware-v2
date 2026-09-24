/** Local vault cryptography — Web Crypto API only. No third-party crypto.
 *
 * Scheme: PBKDF2-SHA-256 (210k iterations, random 16-byte salt) → AES-GCM-256.
 * The derived key is created once at unlock, held in memory for the session,
 * and dropped on lock. This is exactly what the product claims — nothing more. */

const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedEnvelope {
  v: 1;
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iter: number;
  salt: string; // base64
  iv: string; // base64
  ct: string; // base64
}

/** In-memory derived key for the unlocked session. Never persisted. */
export interface SessionKey {
  key: CryptoKey;
  salt: string; // base64
  iter: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function newSaltB64(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

async function deriveKey(passphrase: string, saltB64: string, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltB64) as BufferSource, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Unlock step 1: derive (and keep) the session key from an existing vault envelope. */
export async function deriveSessionKey(passphrase: string, envelope: EncryptedEnvelope): Promise<SessionKey> {
  const key = await deriveKey(passphrase, envelope.salt, envelope.iter);
  return { key, salt: envelope.salt, iter: envelope.iter };
}

/** Unlock step 2: decrypt with the session key. Throws on wrong passphrase / tampering. */
export async function openWithSessionKey<T>(envelope: EncryptedEnvelope, session: SessionKey): Promise<T> {
  if (envelope.v !== 1) throw new Error('unsupported-vault-version');
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) as BufferSource },
      session.key,
      fromBase64(envelope.ct) as BufferSource,
    );
    return JSON.parse(decoder.decode(pt)) as T;
  } catch {
    throw new Error('wrong-passphrase');
  }
}

/** Persist step: encrypt the vault with the session key (fresh IV each save). */
export async function sealWithSessionKey(value: unknown, session: SessionKey): Promise<EncryptedEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = encoder.encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    session.key,
    plaintext as BufferSource,
  );
  return {
    v: 1,
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iter: session.iter,
    salt: session.salt,
    iv: toBase64(iv),
    ct: toBase64(ct),
  };
}

/** Signup step: create a brand-new salt + key for a new local profile. */
export async function createVault(passphrase: string, value: unknown): Promise<{ envelope: EncryptedEnvelope; session: SessionKey }> {
  const salt = newSaltB64();
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const session: SessionKey = { key, salt, iter: PBKDF2_ITERATIONS };
  const envelope = await sealWithSessionKey(value, session);
  return { envelope, session };
}

/** Encrypt file bytes with the session key (Health Vault documents). */
export async function sealBytes(data: ArrayBuffer, session: SessionKey): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, session.key, data);
  return { iv: toBase64(iv), ct: toBase64(ct) };
}

export async function openBytes(payload: { iv: string; ct: string }, session: SessionKey): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as BufferSource },
    session.key,
    fromBase64(payload.ct) as BufferSource,
  );
}
