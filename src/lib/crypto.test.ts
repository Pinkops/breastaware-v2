import { describe, expect, it } from 'vitest';
import { createVault, openWithSessionKey, sealWithSessionKey, sealBytes, openBytes } from './crypto';
import type { EncryptedEnvelope } from './crypto';

describe('vault crypto', () => {
  it('round-trips JSON through createVault → openWithSessionKey', async () => {
    const payload = { note: 'tender spot, right side', n: 3, nested: { ok: true } };
    const { envelope, session } = await createVault('correct-horse-battery', payload);
    const opened = await openWithSessionKey<typeof payload>(envelope, session);
    expect(opened).toEqual(payload);
  });

  it('rejects the wrong passphrase', async () => {
    const { envelope } = await createVault('right-passphrase', { secret: true });
    const wrongSalt: EncryptedEnvelope = { ...envelope };
    // Derive with wrong passphrase against same salt
    const { deriveSessionKey } = await import('./crypto');
    const badSession = await deriveSessionKey('wrong-passphrase', wrongSalt);
    await expect(openWithSessionKey(wrongSalt, badSession)).rejects.toThrow('wrong-passphrase');
  });

  it('re-seals with a fresh IV each save (ciphertexts differ)', async () => {
    const { session } = await createVault('passphrase-one', { v: 1 });
    const a = await sealWithSessionKey({ v: 1 }, session);
    const b = await sealWithSessionKey({ v: 1 }, session);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
    expect(await openWithSessionKey<{ v: number }>(b, session)).toEqual({ v: 1 });
  });

  it('never stores the passphrase or key in the envelope', async () => {
    const passphrase = 'super-secret-passphrase-123';
    const { envelope } = await createVault(passphrase, { health: 'data' });
    const serialized = JSON.stringify(envelope);
    expect(serialized).not.toContain(passphrase);
    expect(serialized).not.toContain('data');
  });

  it('round-trips file bytes', async () => {
    const { session } = await createVault('file-pass', {});
    const bytes = new TextEncoder().encode('document-bytes').buffer as ArrayBuffer;
    const sealed = await sealBytes(bytes, session);
    const opened = await openBytes(sealed, session);
    expect(new TextDecoder().decode(opened)).toBe('document-bytes');
  });
});
