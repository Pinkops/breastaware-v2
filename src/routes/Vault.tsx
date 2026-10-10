import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { MAX_FILE_BYTES, MAX_VAULT_BYTES, getDocBytes, putDocBytes, deleteDocBytes, hasDocumentCapacity, type StoredDocBytes } from '../lib/storage';
import { sealBytes } from '../lib/crypto';
import { downloadDocument } from '../lib/export';
import { Banner, Badge, Button, EmptyState, Field, PageHead, TextInput } from '../components/primitives';
import { IconDoc, IconDownload, IconLock, IconPlus, IconTrash } from '../components/icons';
import { fileSize, formatDay, friendlyError, nowISO, uid } from '../lib/util';
import type { VaultDocumentMeta } from '../lib/types';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'text/plain',
];

export function VaultPage() {
  const { data, update, session, mode } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!data) return null;

  const docs = [...data.documents].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));

  async function upload() {
    setError('');
    if (!pending) return;
    if (!ALLOWED_TYPES.includes(pending.type) && !/\.(pdf|png|jpe?g|heic|heif|txt)$/i.test(pending.name)) {
      setError('That file type is not allowed. Use PDF, JPG, PNG, HEIC, or plain text.');
      return;
    }
    if (pending.size > MAX_FILE_BYTES) {
      setError(`Files must be ${fileSize(MAX_FILE_BYTES)} or smaller.`);
      return;
    }
    const existingBytes = docs.reduce((sum, document) => sum + document.size, 0);
    if (!hasDocumentCapacity(existingBytes, pending.size)) {
      setError(`Your document vault is limited to ${fileSize(MAX_VAULT_BYTES)}. Delete a document before adding this file.`);
      return;
    }
    if (mode === 'demo') {
      setError('File upload is available in your own private vault, not in demo mode.');
      return;
    }
    if (!session) {
      setError('Unlock your vault to add documents.');
      return;
    }

    setBusy(true);
    const id = uid();
    let bytesStored = false;
    try {
      const buf = await pending.arrayBuffer();
      const sealed = await sealBytes(buf, session);
      const rec: StoredDocBytes = { id, owner: 'vault', ...sealed };
      await putDocBytes(rec);
      bytesStored = true;
      const meta: VaultDocumentMeta = {
        id,
        name: pending.name.slice(0, 120),
        type: pending.type || 'application/octet-stream',
        size: pending.size,
        addedAt: nowISO(),
        note: note.trim().slice(0, 300),
      };
      update((d) => ({ ...d, documents: [meta, ...d.documents] }));
      setPending(null);
      setNote('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(friendlyError(err, 'We could not store that document. Please try again.'));
      if (bytesStored) await deleteDocBytes(id).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }


  async function download(meta: VaultDocumentMeta) {
    setError('');
    if (!session) {
      setError('Unlock your vault to download documents.');
      return;
    }
    try {
      await downloadDocument(meta.id, meta.name, session);
    } catch (err) {
      setError(friendlyError(err, 'We could not open that document.'));
    }
  }

  async function remove(meta: VaultDocumentMeta) {
    if (!window.confirm(`Delete “${meta.name}” permanently?`)) return;
    try {
      await deleteDocBytes(meta.id);
      update((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== meta.id) }));
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const totalListed = docs.reduce((s, d) => s + d.size, 0);

  return (
    <>
      <PageHead
        eyebrow="Secondary"
        title="Health Vault"
        lede="Supporting documents — result letters, referral notes, insurance paperwork you choose to keep beside your records."
        actions={<Badge tone="accent"><IconLock style={{ width: 12, height: 12 }} /> Stored on this device</Badge>}
      />

      <Banner tone="info">
        Documents are encrypted and stored <strong>only in this browser on this device</strong> — there is no server
        copy, no public link, and no signed URL because no remote storage exists. Clearing browser data deletes them,
        so keep an <Link to="/settings/export">export</Link> if the files matter. Limits: {fileSize(MAX_FILE_BYTES)}{' '}
        per file, {fileSize(MAX_VAULT_BYTES)} total.
      </Banner>

      {error && (
        <div className="mt-4">
          <Banner tone="danger">{error}</Banner>
        </div>
      )}

      <div className="card mt-4">
        <p className="card__title">Add a document</p>
        <Field label="Choose file" htmlFor="doc-file" hint="PDF, JPG, PNG, HEIC, or plain text.">
          <input
            ref={fileRef}
            id="doc-file"
            type="file"
            className="input"
            style={{ padding: '9px 12px' }}
            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.txt,application/pdf,image/*,text/plain"
            onChange={(e) => setPending(e.target.files?.[0] ?? null)}
          />
        </Field>
        <Field label="Note" htmlFor="doc-note" optional hint="What is this document?">
          <TextInput id="doc-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button onClick={upload} disabled={!pending || busy}>
          <IconPlus style={{ width: 16, height: 16 }} /> {busy ? 'Encrypting…' : 'Add to vault'}
        </Button>
        {pending && (
          <p className="small muted mt-4 mb-0">
            Selected: {pending.name} ({fileSize(pending.size)})
          </p>
        )}
      </div>

      <div className="mt-6">
        {docs.length === 0 ? (
          <EmptyState title="No documents yet" icon={<IconLock />}>
            Anything you add stays on this device, encrypted with your passcode. Use it for supporting paperwork only —
            your observations and notes already live in your timeline.
          </EmptyState>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {docs.map((m) => (
                <li key={m.id} className="list-item">
                  <span className="action-card__icon action-card__icon--ink" style={{ width: 42, height: 42, borderRadius: 11 }} aria-hidden="true">
                    <IconDoc style={{ width: 20, height: 20 }} />
                  </span>
                  <div className="list-item__body">
                    <div className="list-item__title">{m.name}</div>
                    <div className="list-item__meta">
                      <span>{fileSize(m.size)}</span>
                      <span>Added {formatDay(m.addedAt.slice(0, 10))}</span>
                      {m.note && <span>“{m.note}”</span>}
                    </div>
                    <div className="list-item__actions">
                      <Button size="sm" variant="secondary" onClick={() => download(m)}>
                        <IconDownload style={{ width: 14, height: 14 }} /> Download
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(m)}>
                        <IconTrash style={{ width: 14, height: 14 }} /> Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="small muted mt-4">
              {docs.length} document{docs.length === 1 ? '' : 's'} · {fileSize(totalListed)} listed
            </p>
          </>
        )}
      </div>

      <div className="banner banner--warn mt-6" style={{ display: 'block' }}>
        <p style={{ margin: 0 }}>
          <strong>What we do not claim:</strong> no &ldquo;military-grade security,&rdquo; no &ldquo;100% secure,&rdquo;
          no &ldquo;nobody can ever access your data.&rdquo; What we can verify: files are AES-GCM encrypted under your
          passcode-derived key before touching disk, and only unlocked in this session. Device-level security (your
          screen lock, your device passcode) still matters.{' '}
          <Link to="/settings/privacy">Privacy details</Link>
        </p>
      </div>
    </>
  );
}

export { getDocBytes };
