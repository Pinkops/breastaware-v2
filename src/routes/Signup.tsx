import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Banner, Button, CheckRow, Field, TextInput } from '../components/primitives';
import { BrandMark } from '../components/icons';

const MIN_LEN = 8;

export function SignupPage() {
  const { createProfile, busy, error, clearError, status, mode } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ack, setAck] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (status === 'ready') navigate('/onboarding', { replace: true });
    if (mode === 'demo') navigate('/', { replace: true });
  }, [status, mode, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError('');
    if (pass.length < MIN_LEN) {
      setLocalError(`Choose a passcode of at least ${MIN_LEN} characters.`);
      return;
    }
    if (pass !== confirm) {
      setLocalError('The passcodes do not match.');
      return;
    }
    if (!ack) {
      setLocalError('Please confirm you understand the passcode cannot be recovered.');
      return;
    }
    try {
      await createProfile(displayName || 'Me', pass);
      navigate('/onboarding', { replace: true });
    } catch {
      /* error surfaced via context */
    }
  }

  const shown = localError || error;

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

        <h1>Create your local profile</h1>
        <p className="sub">
          This profile lives only in this browser on this device. It is <strong>not a cloud account</strong> — there is
          no server that can see your name, passcode, or records.
        </p>

        {shown && (
          <div style={{ marginBottom: '1rem' }}>
            <Banner tone="danger">{shown}</Banner>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <Field
            label="What should we call you?"
            htmlFor="displayName"
            hint="Used to title your visit summaries. You can change it later."
            optional
          >
            <TextInput
              id="displayName"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              placeholder="First name or nickname"
            />
          </Field>

          <Field
            label="Passcode"
            htmlFor="newpass"
            hint={`At least ${MIN_LEN} characters. Used to encrypt your data on this device.`}
          >
            <TextInput
              id="newpass"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_LEN}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Field>

          <Field label="Confirm passcode" htmlFor="confirmpass">
            <TextInput
              id="confirmpass"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>

          <div className="card card--flat" style={{ background: 'var(--warn-soft)', borderColor: '#e8dcc3', marginBottom: '1.25rem' }}>
            <CheckRow id="ack" checked={ack} onChange={setAck}>
              I understand my passcode <strong>cannot be recovered</strong>. My data stays on this device, and if I lose
              my passcode or clear browser data, the only way back is an export I made myself.
            </CheckRow>
          </div>

          <Button type="submit" block size="lg" disabled={busy}>
            {busy ? 'Creating…' : 'Create profile & continue'}
          </Button>
        </form>

        <p className="center small muted" style={{ marginTop: '1.5rem' }}>
          Already have a local profile? <Link to="/login">Unlock it</Link>
        </p>
      </div>
    </div>
  );
}
