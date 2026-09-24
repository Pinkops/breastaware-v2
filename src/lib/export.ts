import type { AppData } from './types';
import type { SessionKey } from './crypto';
import { getDocBytes } from './storage';
import { openBytes } from './crypto';
import { friendlyError } from './util';

/** Full user-owned export (§43 Q6): records + document metadata + document bytes. */
export async function exportAll(data: AppData, session: SessionKey): Promise<void> {
  const documents: Array<{ meta: unknown; contentBase64: string; note: string }> = [];

  for (const meta of data.documents) {
    try {
      const stored = await getDocBytes(meta.id);
      if (stored) {
        const bytes = await openBytes(stored, session);
        documents.push({
          meta,
          contentBase64: arrayBufferToBase64(bytes),
          note: 'File contents included as base64. Decode to restore the original file.',
        });
      }
    } catch {
      documents.push({ meta, contentBase64: '', note: 'File contents could not be decrypted for this export.' });
    }
  }

  const payload = {
    product: 'BreastAware',
    exportVersion: 2,
    exportedAt: new Date().toISOString(),
    note: 'This file contains all data you own in BreastAware on this device.',
    data,
    documents,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `breastaware-export-${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportSummaryText(text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `breastaware-visit-summary-${new Date().toISOString().slice(0, 10)}.txt`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function downloadDocument(metaId: string, filename: string, session: SessionKey): Promise<void> {
  const stored = await getDocBytes(metaId);
  if (!stored) throw new Error('storage-unavailable');
  const bytes = await openBytes(stored, session);
  const blob = new Blob([bytes], { type: mimeFromName(filename) });
  downloadBlob(blob, filename);
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

export function exportError(err: unknown): string {
  return friendlyError(err, 'Your export could not be completed. Please try again.');
}
