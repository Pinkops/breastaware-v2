import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Banner, Button, Field, TextInput } from '../components/primitives';
import { BrandMark, IconLock } from '../components/icons';

export function LoginPage() {
  const { unlock, busy, error, clearError, status } = useApp();
  const [passphrase, setPassphrase] = useState('');
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Only an internal path is accepted — never health information (§21).
  const rawNext = params.get('next') ?? '';
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !/[\s<>"']/.test(rawNext)
      ? rawNext
      : '/home';

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (status === 'no-profile') navigate('/signup', { replace: true });
  }, [status, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passphrase) return;
    const ok = await unlock(passphrase);
    if (ok) navigate(next, { replace: true });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="brand">
          <span className="brand__mark">
            <BrandMark size={40} />
          </span>
          <span>
            <span className="brand__name">BreastAware</span>
            <span className="brand__tag">Private breast-health organizer</span>
          </span>
        </Link>

        <h1>Welcome back</h1>
        <p className="sub">
          Enter your passcode to unlock the vault stored on <strong>this device</strong>.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Banner tone="danger">{error}</Banner>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <Field label="Passcode" htmlFor="passcode">
            <TextInput
              id="passcode"
              type="password"
              autoComplete="current-password"
              inputMode="text"
              required
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              aria-describedby="passcode-note"
            />
          </Field>
          <p className="hint" id="passcode-note" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <IconLock style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0 }} />
            <span>
              Your passcode is never sent anywhere. If you have forgotten it, the vault cannot be recovered — you can
              start fresh and restore from an export if you made one.
            </span>
          </p>

          <Button type="submit" block size="lg" disabled={busy || !passphrase}>
            {busy ? 'Unlocking…' : 'Unlock BreastAware'}
          </Button>
        </form>

        <p className="center small muted" style={{ marginTop: '1.5rem' }}>
          No profile on this device yet? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
