import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Modal } from '../components/Modal';
import { BrandMark, IconArrowRight, IconLock, IconTimeline, IconPrep, IconPlus, IconEye } from '../components/icons';
import { ARTICLES } from '../content/education';

export function LandingPage() {
  const { mode, enterDemo, status } = useApp();
  const navigate = useNavigate();
  const [demoWarningOpen, setDemoWarningOpen] = useState(false);

  function continueToDemo() {
    setDemoWarningOpen(false);
    enterDemo();
    navigate('/home');
  }

  const primaryCta =
    mode === 'demo'
      ? { label: 'Continue in demo', to: '/home' }
      : status === 'ready'
        ? { label: 'Continue to Home', to: '/home' }
        : status === 'no-profile'
          ? { label: 'Create my private profile', to: '/signup' }
          : { label: 'Unlock BreastAware', to: '/login' };

  return (
    <div className="marketing">
      <header className="marketing__bar">
        <Link to="/" className="brand">
          <span className="brand__mark">
            <BrandMark size={40} />
          </span>
          <span>
            <span className="brand__name">BreastAware</span>
            <span className="brand__tag">Private breast-health organizer</span>
          </span>
        </Link>
        <nav className="btn-row" aria-label="Account">
          <Link to={primaryCta.to} className="btn btn--secondary btn--sm">
            {status === 'no-profile' ? 'Sign up' : 'Sign in'}
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="descriptor">Private breast-health organizer</p>
          <h1>Know your baseline. Record what you notice. Prepare for the conversation.</h1>
          <p className="promise">
            Keep track of what&rsquo;s normal for you, record changes over time, and prepare organized notes for
            conversations with your healthcare professional.
          </p>

          <div className="workflow" aria-label="How BreastAware works">
            <span className="workflow__step">Know</span>
            <span className="workflow__arrow" aria-hidden="true">→</span>
            <span className="workflow__step">Record</span>
            <span className="workflow__arrow" aria-hidden="true">→</span>
            <span className="workflow__step">Organize</span>
            <span className="workflow__arrow" aria-hidden="true">→</span>
            <span className="workflow__step">Prepare</span>
            <span className="workflow__arrow" aria-hidden="true">→</span>
            <span className="workflow__step">Summarize</span>
          </div>

          <div className="hero__actions">
            <Link to={primaryCta.to} className="btn btn--primary btn--lg">
              {primaryCta.label} <IconArrowRight />
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--lg"
              onClick={() => setDemoWarningOpen(true)}
            >
              Explore with demo data
            </button>
          </div>

          <p className="hero__note">
            <strong>BreastAware does not diagnose or interpret breast changes.</strong> It is an organization tool —
            a private place between &ldquo;I noticed something&rdquo; and &ldquo;I want a useful conversation with my
            healthcare professional.&rdquo; Your records are stored only on this device.
          </p>
        </div>

        <div className="preview-card" aria-label="What you can do">
          <p className="card__title">One connected workflow</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <span className="action-card__icon" style={{ width: 40, height: 40, borderRadius: 11 }}>
                <IconEye style={{ width: 20, height: 20 }} />
              </span>
              <span>
                <strong>My Normal</strong>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--fs-sm)' }}>
                  A personal baseline of what is usual for you.
                </span>
              </span>
            </li>
            <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <span className="action-card__icon action-card__icon--warm" style={{ width: 40, height: 40, borderRadius: 11 }}>
                <IconPlus style={{ width: 20, height: 20 }} />
              </span>
              <span>
                <strong>Record a Change</strong>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--fs-sm)' }}>
                  What, where, and when — with an optional body-map marker.
                </span>
              </span>
            </li>
            <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <span className="action-card__icon" style={{ width: 40, height: 40, borderRadius: 11 }}>
                <IconTimeline style={{ width: 20, height: 20 }} />
              </span>
              <span>
                <strong>My Timeline</strong>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--fs-sm)' }}>
                  Observations, questions, appointments, and screening in one history.
                </span>
              </span>
            </li>
            <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <span className="action-card__icon" style={{ width: 40, height: 40, borderRadius: 11 }}>
                <IconPrep style={{ width: 20, height: 20 }} />
              </span>
              <span>
                <strong>Prepare for a Visit</strong>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--fs-sm)' }}>
                  Gather questions and context, then create a printable summary.
                </span>
              </span>
            </li>
          </ul>
          <p className="small muted" style={{ margin: '1.25rem 0 0' }}>
            Short version for later: <strong>your notes won&rsquo;t live in your memory or scattered apps.</strong>
          </p>
        </div>
      </section>

      <footer className="marketing__footer">
        <div>
          <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '0.35rem' }}>Not a diagnostic product</strong>
          BreastAware does not determine whether a change is cancer, benign, dangerous, normal, or abnormal, and does
          not replace professional medical care.
        </div>
        <div>
          <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '0.35rem' }}>
            <IconLock style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Stored on this device
          </strong>
          Records live in this browser, encrypted with your passcode. No health data is sent to BreastAware servers —
          there are none.{' '}
          <Link to="/education/privacy-and-health-information">How privacy works</Link>
        </div>
        <div>
          <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '0.35rem' }}>Learn at your pace</strong>
          A small, source-backed education library ({ARTICLES.length} articles) from CDC, NCI, NHS, Cancer Council
          Australia, and official screening programs. <Link to="/education">Browse education</Link>
        </div>
      </footer>

      <Modal
        open={demoWarningOpen}
        onClose={() => setDemoWarningOpen(false)}
        title="Before you explore the demo"
        titleId="demo-warning-title"
        centered
      >
        <div className="demo-warning">
          <div className="demo-warning__icon" aria-hidden="true">
            <IconLock />
          </div>
          <p className="demo-warning__lead">Explore every feature safely with sample information.</p>
          <div className="demo-warning__notice">
            <strong>This is a temporary interactive demo.</strong>
            <span>Your edits are not saved to a private vault and may be cleared. Please do not enter real health information.</span>
          </div>
          <div className="demo-warning__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={continueToDemo}>
              Continue to demo <IconArrowRight />
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setDemoWarningOpen(false)}>
              Go back
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
