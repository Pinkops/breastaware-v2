import { Link } from 'react-router-dom';
import { EmptyState, LinkButton, PageHead } from '../components/primitives';
import { IconSpark } from '../components/icons';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: '32rem', margin: '0 auto', paddingTop: '3rem' }}>
      <PageHead eyebrow="Error" title="Page not found" />
      <EmptyState
        title="That page doesn't exist"
        icon={<IconSpark />}
        action={
          <div className="btn-row btn-row--center">
            <LinkButton to="/home">Go Home</LinkButton>
            <LinkButton to="/timeline" variant="secondary">
              My Timeline
            </LinkButton>
          </div>
        }
      >
        The link may be out of date. Your records are safe — nothing was lost.
      </EmptyState>
      <p className="small muted center">
        Need a specific record? <Link to="/timeline">My Timeline</Link> lists everything you own on this device.
      </p>
    </div>
  );
}
