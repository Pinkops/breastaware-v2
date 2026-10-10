import type { AppData } from './types';
import type { EncryptedEnvelope, SessionKey } from './crypto';
import { openWithSessionKey, sealWithSessionKey } from './crypto';

const VAULT_KEY = 'ba2.vault.v2';
const DEMO_KEY = 'ba2.demo.v2';
const DEMO_SESSION_FLAG = 'ba2.mode';
export const DOC_DB = 'ba2.docs.v2';
export const DOC_STORE = 'files';

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_VAULT_BYTES = 25 * 1024 * 1024; // 25 MB total

export function hasDocumentCapacity(existingBytes: number, incomingBytes: number): boolean {
  return existingBytes >= 0 && incomingBytes >= 0 && incomingBytes <= MAX_FILE_BYTES && existingBytes + incomingBytes <= MAX_VAULT_BYTES;
}

export function isDemoMode(): boolean {
  try {
    return sessionStorage.getItem(DEMO_SESSION_FLAG) === 'demo';
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(DEMO_SESSION_FLAG, 'demo');
    else sessionStorage.removeItem(DEMO_SESSION_FLAG);
  } catch {
    /* storage unavailable — mode simply won't persist across reloads */
  }
}

export function hasProfile(): boolean {
  try {
    return localStorage.getItem(VAULT_KEY) !== null;
  } catch {
    return false;
  }
}

export function readEnvelope(): EncryptedEnvelope | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? (JSON.parse(raw) as EncryptedEnvelope) : null;
  } catch {
    return null;
  }
}

export async function saveVault(data: AppData, session: SessionKey): Promise<void> {
  try {
    const envelope = await sealWithSessionKey(data, session);
    localStorage.setItem(VAULT_KEY, JSON.stringify(envelope));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('quota-exceeded');
    }
    throw err;
  }
}

export async function loadVault(envelope: EncryptedEnvelope, session: SessionKey): Promise<AppData> {
  return openWithSessionKey<AppData>(envelope, session);
}

export async function writeNewVault(data: AppData, passphrase: string): Promise<SessionKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const session: SessionKey = { key, salt: saltB64, iter: 210_000 };
  const envelope = await sealWithSessionKey(data, session);
  localStorage.setItem(VAULT_KEY, JSON.stringify(envelope));
  return session;
}

/* ---------- Demo store: sessionStorage only, never touches the real vault ---------- */

export function readDemo(): AppData | null {
  try {
    const raw = sessionStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AppData) : null;
  } catch {
    return null;
  }
}

export function writeDemo(data: AppData): void {
  try {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(data));
  } catch {
    /* quota — demo simply won't persist this session */
  }
}

export function clearDemo(): void {
  try {
    sessionStorage.removeItem(DEMO_KEY);
    sessionStorage.removeItem(DEMO_SESSION_FLAG);
  } catch {
    /* ignore */
  }
}

/** Full local wipe: vault, demo data, and stored document bytes. */
export async function wipeEverything(): Promise<void> {
  try {
    localStorage.removeItem(VAULT_KEY);
  } catch {
    /* ignore */
  }
  clearDemo();
  await deleteAllDocBytes();
}

/* ---------- IndexedDB: encrypted document bytes ---------- */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DOC_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DOC_STORE)) {
        db.createObjectStore(DOC_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('storage-unavailable'));
  });
}

export interface StoredDocBytes {
  id: string;
  owner: 'vault' | 'demo';
  iv: string;
  ct: string;
}

export async function putDocBytes(rec: StoredDocBytes): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readwrite');
      tx.objectStore(DOC_STORE).put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('storage-unavailable'));
      tx.onabort = () => reject(tx.error ?? new Error('storage-unavailable'));
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') throw new Error('quota-exceeded');
    throw err;
  } finally {
    db.close();
  }
}

export async function getDocBytes(id: string): Promise<StoredDocBytes | undefined> {
  const db = await openDb();
  try {
    return await new Promise<StoredDocBytes | undefined>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readonly');
      const req = tx.objectStore(DOC_STORE).get(id);
      req.onsuccess = () => resolve(req.result as StoredDocBytes | undefined);
      req.onerror = () => reject(req.error ?? new Error('storage-unavailable'));
    });
  } finally {
    db.close();
  }
}

export async function deleteDocBytes(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readwrite');
      tx.objectStore(DOC_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('storage-unavailable'));
    });
  } finally {
    db.close();
  }
}

export async function deleteAllDocBytes(): Promise<void> {
  try {
    const db = await openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOC_STORE, 'readwrite');
        tx.objectStore(DOC_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('storage-unavailable'));
      });
    } finally {
      db.close();
    }
  } catch {
    /* database may not exist yet */
  }
}
