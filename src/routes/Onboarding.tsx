import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Button, LinkButton } from '../components/primitives';
import { BrandMark, IconEye, IconPlus, IconPrep, IconShield } from '../components/icons';

export function OnboardingPage() {
  const { update, data, mode } = useApp();
  const navigate = useNavigate();

  function finish() {
    update((d) => ({ ...d, settings: { ...d.settings, onboardingDone: true } }));
    navigate('/home', { replace: true });
  }

  function choose(to: string) {
    finish();
    navigate(to);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: '32rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Link to="/" className="brand" aria-label="BreastAware home">
            <span className="brand__mark">
              <BrandMark size={40} />
            </span>
            <span className="brand__name" style={{ fontSize: '1.15rem' }}>
              BreastAware
            </span>
          </Link>
        </div>

        <h1 style={{ fontSize: 'var(--fs-2xl)' }}>
          Welcome{mode !== 'demo' && data ? `, ${data.profile.displayName}` : ''}.
        </h1>
        <p className="sub" style={{ marginBottom: '1.5rem' }}>
          A private place to organize your breast-health information and prepare for healthcare conversations.
        </p>

        <div className="stack stack--sm" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <div className="list-item" style={{ margin: 0 }}>
            <span className="action-card__icon" style={{ width: 42, height: 42 }}>
              <IconEye style={{ width: 20, height: 20 }} />
            </span>
            <div className="list-item__body">
              <div className="list-item__title">Know</div>
              <div className="small muted">Create your personal baseline — what is usual for you.</div>
            </div>
          </div>
          <div className="list-item" style={{ margin: 0 }}>
            <span className="action-card__icon action-card__icon--warm" style={{ width: 42, height: 42 }}>
              <IconPlus style={{ width: 20, height: 20 }} />
            </span>
            <div className="list-item__body">
              <div className="list-item__title">Record</div>
              <div className="small muted">Keep track of changes you notice, over time.</div>
            </div>
          </div>
          <div className="list-item" style={{ margin: 0 }}>
            <span className="action-card__icon" style={{ width: 42, height: 42 }}>
              <IconPrep style={{ width: 20, height: 20 }} />
            </span>
            <div className="list-item__body">
              <div className="list-item__title">Prepare</div>
              <div className="small muted">Organize questions and information for visits.</div>
            </div>
          </div>
        </div>

        <div className="banner banner--info" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <IconShield />
          <div>
            <strong>BreastAware does not diagnose or interpret breast changes.</strong> It helps you document and
            organize. Decisions belong in a conversation with a healthcare professional.
          </div>
        </div>

        <p className="label" style={{ textAlign: 'center' }}>
          What would you like to do first?
        </p>
        <div className="stack stack--sm">
          <Button block size="lg" onClick={() => choose('/my-normal')}>
            Create My Normal
          </Button>
          <Button block size="lg" variant="secondary" onClick={() => choose('/record')}>
            Record Something I Noticed
          </Button>
          <Button block size="lg" variant="secondary" onClick={() => choose('/prepare')}>
            Prepare for a Visit
          </Button>
        </div>

        <p className="center small muted" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="link-quiet" onClick={finish}>
            Skip — take me to Home
          </button>
        </p>
      </div>
    </div>
  );
}

export { LinkButton };
