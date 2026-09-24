import { NavLink, Navigate, Outlet, Route, Routes, Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useApp } from '../lib/app-context';
import { getEntitlementProvider } from '../lib/entitlement';
import { exportAll } from '../lib/export';
import {
  Badge,
  Banner,
  Button,
  CheckRow,
  Field,
  PageHead,
  Select,
  TextInput,
} from '../components/primitives';
import { IconDoc, IconLock, IconShield, IconTrash, IconUser, IconDownload, IconInfo } from '../components/icons';
import { formatTimestamp } from '../lib/util';

/* ---------- Layout ---------- */

function SettingsLayout() {
  return (
    <>
      <PageHead
        eyebrow="Privacy & Settings"
        title="Your data, your controls"
        lede="Everything here describes what the code actually does — no promise is made that the implementation does not keep."
      />
      <div className="settings-layout">
        <nav className="settings-nav no-print" aria-label="Settings sections">
          <NavLink to="/settings/profile">Profile & access</NavLink>
          <NavLink to="/settings/privacy">Privacy center</NavLink>
          <NavLink to="/settings/export">Data export</NavLink>
          <NavLink to="/settings/delete">Delete data</NavLink>
          <NavLink to="/settings/about">About & security</NavLink>
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </>
  );
}

/* ---------- Profile ---------- */

function ProfileSection() {
  const { data, update, mode, lock } = useApp();
  const [name, setName] = useState(data?.profile.displayName ?? '');
  const [saved, setSaved] = useState(false);

  if (!data) return null;

  function saveName(e: FormEvent) {
    e.preventDefault();
    update((d) => ({ ...d, profile: { ...d.profile, displayName: name.trim() || 'Me' } }));
    setSaved(true);
  }

  return (
    <div className="stack">
      <section className="card">
        <p className="card__title" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <IconUser style={{ width: 14, height: 14 }} /> Profile
        </p>
        <form onSubmit={saveName}>
          <Field label="Name on summaries" htmlFor="pname" hint="Used as “Prepared by” on your visit summaries.">
            <TextInput id="pname" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          </Field>
          <div className="btn-row">
            <Button type="submit" size="sm">Save</Button>
            {saved && <Badge tone="ok">Saved</Badge>}
          </div>
        </form>
        <dl className="dl mt-4">
          <div className="dl__row">
            <dt>Local profile created</dt>
            <dd>{formatTimestamp(data.profile.createdAt)}</dd>
          </div>
          <div className="dl__row">
            <dt>Account type</dt>
            <dd>
              Local profile in this browser — <strong>not a cloud account</strong>.{' '}
              {mode === 'demo' && '(Currently browsing demo data.)'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <p className="card__title">Session</p>
        <div className="field">
          <label className="label" htmlFor="autolock">
            Auto-lock after inactivity
          </label>
          <p className="hint">The vault re-locks and clears decrypted data from memory after this idle period.</p>
          <Select
            id="autolock"
            value={String(data.settings.autoLockMinutes)}
            onChange={(e) =>
              update((d) => ({
                ...d,
                settings: { ...d.settings, autoLockMinutes: Number(e.target.value) as typeof d.settings.autoLockMinutes },
              }))
            }
          >
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </Select>
        </div>
        <CheckRow
          id="appt-hints"
          checked={data.settings.showAppointmentHints}
          onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, showAppointmentHints: v } }))}
        >
          Show upcoming appointment hints on Home
        </CheckRow>
        <div className="btn-row mt-4">
          <Button variant="secondary" size="sm" onClick={lock}>
            <IconLock style={{ width: 15, height: 15 }} /> Lock now
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Privacy center ---------- */

function PrivacySection() {
  const { data } = useApp();
  if (!data) return null;

  return (
    <div className="stack">
      <section className="card">
        <p className="card__title" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <IconShield style={{ width: 14, height: 14 }} /> My data
        </p>
        <div className="stack stack--sm">
          <NavLink to="/settings/export" className="btn btn--secondary" style={{ justifyContent: 'flex-start' }}>
            <IconDownload style={{ width: 16, height: 16 }} /> Export my data
          </NavLink>
          <NavLink to="/settings/delete" className="btn btn--danger-outline" style={{ justifyContent: 'flex-start' }}>
            <IconTrash style={{ width: 16, height: 16 }} /> Delete my data &amp; profile
          </NavLink>
        </div>
      </section>

      <section className="card">
        <p className="card__title">Privacy answers</p>
        <dl className="dl">
          <div className="dl__row">
            <dt>What data is stored?</dt>
            <dd>
              Exactly what you type: your baseline, observations, questions, appointments, screening records, visit
              preparations, summaries, settings, your display name, and any documents you add. Nothing else — no
              demographics, no location, no contacts, no advertising identifiers.
            </dd>
          </div>
          <div className="dl__row">
            <dt>Why is it stored?</dt>
            <dd>So the app can organize your records and build your summaries — the product itself.</dd>
          </div>
          <div className="dl__row">
            <dt>Where is it stored?</dt>
            <dd>
              In <strong>this browser&rsquo;s storage on this device</strong> (localStorage + IndexedDB), encrypted
              with a key derived from your passcode (PBKDF2-SHA256, 210k iterations → AES-GCM-256). There is no
              BreastAware server database.
            </dd>
          </div>
          <div className="dl__row">
            <dt>Third parties</dt>
            <dd>
              None process your health data — the app makes no network requests with your records, contains no
              analytics, no crash reporters, no advertising SDKs, and no third-party fonts or scripts at runtime.
            </dd>
          </div>
          <div className="dl__row">
            <dt>Retention</dt>
            <dd>
              Data remains until you delete it, clear browser data, or your passcode-gated vault becomes unreadable.
              You control retention: <Link to="/settings/delete">delete anytime</Link>.
            </dd>
          </div>
          <div className="dl__row">
            <dt>URLs &amp; logs</dt>
            <dd>
              Health text never appears in URLs — only random record identifiers. Page titles contain page names, never
              your notes. Server logs cannot contain your health data because it never reaches a server.
            </dd>
          </div>
          <div className="dl__row">
            <dt>Deletion</dt>
            <dd>
              Account deletion in this product means: encrypted vault removed, stored document bytes erased, demo data
              cleared. It is irreversible without an export you made beforehand.
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <p className="card__title">Education vs. your records</p>
        <p className="small mb-0">
          Three categories stay separate: (1) <strong>user-entered information</strong> — yours, encrypted, deletable;{' '}
          (2) <strong>educational information</strong> — static, source-linked articles shipped with the app; (3){' '}
          <strong>application-generated organization</strong> — timeline entries and summaries derived only from (1).
        </p>
      </section>
    </div>
  );
}

/* ---------- Export ---------- */

function ExportSection() {
  const { data, session, mode } = useApp();
  const [status, setStatus] = useState('');

  if (!data) return null;

  async function run() {
    setStatus('');
    if (!session) {
      setStatus('Unlock your vault to export.');
      return;
    }
    try {
      await exportAll(data!, session!);
      setStatus('Export downloaded. Keep it somewhere safe — it is a full copy of everything you own here.');
    } catch {
      setStatus('The export could not be completed. Please try again.');
    }
  }

  const counts = [
    ['Baseline', data.baseline ? 1 : 0],
    ['Observations', data.observations.length],
    ['Questions', data.questions.length],
    ['Appointments', data.appointments.length],
    ['Screening records', data.screenings.length],
    ['Visit preparations', data.preparations.length],
    ['Summaries', data.summaries.length],
    ['Documents', data.documents.length],
  ] as const;

  return (
    <div className="stack">
      <section className="card">
        <p className="card__title" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <IconDoc style={{ width: 14, height: 14 }} /> Export my data
        </p>
        <p>
          Download a single JSON file containing <strong>all records you own</strong> plus document files (base64
          embedded). The export is generated locally and downloaded directly — it is never uploaded anywhere.
        </p>
        <dl className="dl">
          {counts.map(([label, n]) => (
            <div className="dl__row" key={label}>
              <dt>{label}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        <div className="btn-row mt-4">
          <Button onClick={run} disabled={!session || mode === 'demo'}>
            <IconDownload style={{ width: 16, height: 16 }} /> Download my export
          </Button>
        </div>
        {mode === 'demo' && (
          <p className="small muted mt-4 mb-0">Exports apply to your real vault — exit demo mode first.</p>
        )}
        {status && (
          <div className="mt-4">
            <Banner tone="ok">{status}</Banner>
          </div>
        )}
      </section>

      <section className="card">
        <p className="card__title">Import note</p>
        <p className="small mb-0">
          BreastAware V2 reads your own export for support purposes only through a future import tool; today the
          export is your archival safety net (passcode loss, device change, backups).
        </p>
      </section>
    </div>
  );
}

/* ---------- Delete ---------- */

function DeleteSection() {
  const { deleteEverything, busy, mode } = useApp();
  const [phrase, setPhrase] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const expected = 'DELETE';

  async function run() {
    if (!confirmed) return;
    await deleteEverything();
    window.location.href = '/';
  }

  return (
    <div className="stack">
      <section className="card" style={{ borderColor: '#d9b4b4' }}>
        <p className="card__title" style={{ color: 'var(--danger)' }}>
          Delete my data
        </p>
        <Banner tone="danger">
          This permanently removes your encrypted vault, all documents stored by Health Vault, and any demo session
          data <strong>on this device</strong>. There is no server copy to restore from. Export first if you want to
          keep anything.
        </Banner>
        <div className="mt-4">
          <CheckRow id="del-ack" checked={confirmed} onChange={setConfirmed}>
            I understand this <strong>cannot be undone</strong> and that I should{' '}
            <Link to="/settings/export">export my data</Link> first if I want a copy.
          </CheckRow>
        </div>
        <Field label={`Type ${expected} to confirm`} htmlFor="del-phrase">
          <TextInput
            id="del-phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={expected}
          />
        </Field>
        <Button
          variant="danger"
          disabled={!confirmed || phrase.trim().toUpperCase() !== expected || busy}
          onClick={run}
        >
          <IconTrash style={{ width: 16, height: 16 }} /> {busy ? 'Deleting…' : 'Permanently delete everything'}
        </Button>
        {mode === 'demo' && (
          <p className="small muted mt-4 mb-0">You are in demo mode — deleting here still wipes any real local profile on this device.</p>
        )}
      </section>
    </div>
  );
}

/* ---------- About ---------- */

function AboutSection() {
  const { data } = useApp();
  const provider = getEntitlementProvider();
  const entitlement = data?.entitlement;

  return (
    <div className="stack">
      <section className="card">
        <p className="card__title" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <IconInfo style={{ width: 14, height: 14 }} /> About BreastAware V2
        </p>
        <p>
          <strong>BreastAware</strong> — private breast-health organizer. Know your baseline. Record what you notice.
          Prepare for the conversation.
        </p>
        <dl className="dl">
          <div className="dl__row">
            <dt>Version</dt>
            <dd>2.0.0 (local-first PWA)</dd>
          </div>
          <div className="dl__row">
            <dt>License</dt>
            <dd>
              {entitlement?.plan ?? provider.label} — access: {entitlement?.active ? 'active' : 'check failed'}.{' '}
              One-time purchase architecture; payment providers plug into the entitlement layer without touching your
              health data.
            </dd>
          </div>
          <div className="dl__row">
            <dt>What it is not</dt>
            <dd>
              Not a diagnostic tool, not a risk calculator, not a screening authority, not a replacement for
              professional medical care, and not a medical device.
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <p className="card__title">Security posture — verified vs. not</p>
        <ul style={{ paddingLeft: '1.15rem', margin: 0, lineHeight: 1.65 }}>
          <li><strong>Verified in this build:</strong> AES-GCM encryption at rest; wrong passcode rejected; auto-lock clears the session key; export/delete operate only on your unlocked vault; no network calls with health data; no secrets in the client bundle; health text never enters URLs or titles; human-readable errors only.</li>
          <li><strong>By architecture:</strong> no backend means no cross-user API access, no database misconfiguration, no storage-bucket leak — and equally, no cloud backup.</li>
          <li><strong>Not claimed:</strong> HIPAA compliance, SOC2, penetration testing, protection against malware or an attacker with full control of your unlocked device. Device security is your first line.</li>
          <li><strong>Dependency audit:</strong> runtime dependencies are minimal (React, React Router). Run <code>npm audit</code> when deploying; issues will be addressed in updates.</li>
        </ul>
      </section>

      <section className="card">
        <p className="card__title">Medical boundary</p>
        <p className="small mb-0">
          BreastAware never diagnoses, never classifies, never calculates cancer risk, and never generates treatment
          or screening recommendations. When guidance varies by country or circumstance, the app says so and points to
          official sources in <Link to="/education">Education</Link>.
        </p>
      </section>
    </div>
  );
}

/* ---------- Router ---------- */

export function SettingsRoutes() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="privacy" replace />} />
        <Route path="profile" element={<ProfileSection />} />
        <Route path="privacy" element={<PrivacySection />} />
        <Route path="export" element={<ExportSection />} />
        <Route path="delete" element={<DeleteSection />} />
        <Route path="about" element={<AboutSection />} />
        <Route path="*" element={<Navigate to="privacy" replace />} />
      </Route>
    </Routes>
  );
}

export { IconShield };
