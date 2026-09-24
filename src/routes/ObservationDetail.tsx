import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { categoryLabel, locationText } from '../lib/selectors';
import { Badge, Banner, Button, LinkButton, PageHead } from '../components/primitives';
import { BodyMap } from '../components/BodyMap';
import { IconChevronLeft, IconEdit, IconPin, IconQuestion, IconTrash } from '../components/icons';
import { formatDay, formatTimestamp } from '../lib/util';
import type { DiscussedStatus } from '../lib/types';

export function ObservationDetailPage() {
  const { id } = useParams();
  const { data, update } = useApp();
  const navigate = useNavigate();
  if (!data) return null;

  const obs = data.observations.find((o) => o.id === id);
  if (!obs) {
    return (
      <>
        <PageHead title="Observation not found" />
        <Banner tone="warn">
          This observation is not in your records. It may have been deleted.{' '}
          <Link to="/timeline">Back to timeline</Link>.
        </Banner>
      </>
    );
  }

  const relatedQuestions = data.questions.filter((q) => obs.questionIds.includes(q.id));

  function setDiscussed(status: DiscussedStatus) {
    update((d) => ({
      ...d,
      observations: d.observations.map((o) => (o.id === obs!.id ? { ...o, discussedStatus: status, updatedAt: new Date().toISOString() } : o)),
    }));
  }

  function remove() {
    if (!window.confirm('Delete this observation permanently? This cannot be undone.')) return;
    update((d) => ({
      ...d,
      observations: d.observations.filter((o) => o.id !== obs!.id),
      questions: d.questions.map((q) =>
        q.relatedObsIds.includes(obs!.id)
          ? { ...q, relatedObsIds: q.relatedObsIds.filter((x) => x !== obs!.id) }
          : q,
      ),
    }));
    navigate('/timeline');
  }

  return (
    <>
      <Link to="/timeline" className="back-link">
        <IconChevronLeft /> Back to My Timeline
      </Link>

      <PageHead
        eyebrow="Observation"
        title={categoryLabel(obs.category)}
        lede={`First noticed ${formatDay(obs.dateFirstNoticed)} · recorded ${formatTimestamp(obs.createdAt)}`}
        actions={
          <>
            <Badge tone={obs.discussedStatus === 'discussed' ? 'ok' : 'muted'}>
              {obs.discussedStatus === 'discussed' ? 'Discussed with a professional' : 'Not discussed yet'}
            </Badge>
            <Button variant="secondary" size="sm" onClick={remove}>
              <IconTrash style={{ width: 15, height: 15 }} /> Delete
            </Button>
          </>
        }
      />

      <div className="grid-2 grid-2--wide-left" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <p className="card__title">Details</p>
            <dl className="dl">
              <div className="dl__row">
                <dt>Category</dt>
                <dd>{categoryLabel(obs.category)}</dd>
              </div>
              <div className="dl__row">
                <dt>Side</dt>
                <dd>{locationText(obs)}</dd>
              </div>
              <div className="dl__row">
                <dt>First noticed</dt>
                <dd>{formatDay(obs.dateFirstNoticed)}</dd>
              </div>
              <div className="dl__row">
                <dt>Noticed again</dt>
                <dd>{obs.recurrence ? obs.recurrence.replace('-', ' ') : 'Not answered'}</dd>
              </div>
              <div className="dl__row">
                <dt>Notes</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{obs.notes.trim() || 'Not provided'}</dd>
              </div>
              {obs.painNote.trim() && (
                <div className="dl__row">
                  <dt>Pain / tenderness</dt>
                  <dd>{obs.painNote}</dd>
                </div>
              )}
              <div className="dl__row">
                <dt>Last updated</dt>
                <dd>{formatTimestamp(obs.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <p className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconQuestion style={{ width: 14, height: 14 }} /> Related questions
            </p>
            {relatedQuestions.length === 0 ? (
              <p className="small muted mb-0">
                No questions linked yet.{' '}
                <Link to="/questions">Add one</Link> so it rides along with your visit summary.
              </p>
            ) : (
              <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                {relatedQuestions.map((q) => (
                  <li key={q.id} style={{ marginBottom: '0.4rem' }}>
                    {q.text}{' '}
                    <Badge tone={q.status === 'open' ? 'accent' : 'ok'}>{q.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <p className="card__title">Discussion status</p>
            <p className="small muted">
              Marking &ldquo;discussed&rdquo; is a personal note that you raised this with a healthcare professional.
              It is not a clinical result.
            </p>
            <div className="btn-row">
              <Button
                variant={obs.discussedStatus === 'not-discussed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDiscussed('not-discussed')}
                aria-pressed={obs.discussedStatus === 'not-discussed'}
              >
                Not discussed
              </Button>
              <Button
                variant={obs.discussedStatus === 'discussed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDiscussed('discussed')}
                aria-pressed={obs.discussedStatus === 'discussed'}
              >
                <IconEdit style={{ width: 15, height: 15 }} /> Mark as discussed
              </Button>
            </div>
          </section>
        </div>

        <section className="card" aria-labelledby="map-h">
          <p className="card__title" id="map-h" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPin style={{ width: 14, height: 14 }} /> Location on body map
          </p>
          {obs.location ? (
            <BodyMap idPrefix={`obs-${obs.id}`} value={obs.location} onChange={() => undefined} readOnly />
          ) : (
            <p className="small muted">
              No marker was placed for this observation.
              {obs.locationNote ? ` Written location: “${obs.locationNote}”.` : ''}
            </p>
          )}
          <div className="mt-4 btn-row">
            <LinkButton to="/record" variant="secondary" size="sm">
              Record another change
            </LinkButton>
          </div>
        </section>
      </div>
    </>
  );
}
