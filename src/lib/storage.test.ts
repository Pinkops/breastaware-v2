import { describe, expect, it } from 'vitest';
import { hasDocumentCapacity, MAX_FILE_BYTES, MAX_VAULT_BYTES } from './storage';

describe('document vault capacity', () => {
  it('accepts files at the per-file and total boundaries', () => {
    expect(hasDocumentCapacity(0, MAX_FILE_BYTES)).toBe(true);
    expect(hasDocumentCapacity(MAX_VAULT_BYTES - MAX_FILE_BYTES, MAX_FILE_BYTES)).toBe(true);
  });

  it('rejects files over either advertised limit', () => {
    expect(hasDocumentCapacity(0, MAX_FILE_BYTES + 1)).toBe(false);
    expect(hasDocumentCapacity(MAX_VAULT_BYTES - MAX_FILE_BYTES + 1, MAX_FILE_BYTES)).toBe(false);
    expect(hasDocumentCapacity(-1, 1)).toBe(false);
  });
});
