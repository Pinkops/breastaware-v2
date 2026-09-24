import { Link } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { buildTimeline, homeStatus, openQuestionCount, upcomingAppointment } from '../lib/selectors';
import { formatDay, formatDateTime, daysUntil } from '../lib/util';
import { Badge, LinkButton, PageHead } from '../components/primitives';
import {
  IconCalendar,
  IconChevronRight,
  IconDoc,
  IconPlus,
  IconPrep,
  IconQuestion,
  IconScreening,
  IconSpark,
  IconTimeline,
  IconEye,
} from '../components/icons';

export function HomePage() {
  const { data, mode } = useApp();
  if (!data) return null;

  const status = homeStatus(data);
  const events = buildTimeline(data).slice(0, 4);
  const up = upcomingAppointment(data);
  const openQs = openQuestionCount(data.questions);
  const lastSummary = data.summaries[0];

  return (
    <>
      <PageHead
        eyebrow="BreastAware"
        title="Your private breast-health organizer."
        lede="Keep track of what's normal for you, record changes over time, and prepare organized notes for conversations with your healthcare professional."
        actions={
          mode === 'demo' ? (
            <Badge tone="warm">Demo data</Badge>
          ) : (
            <Badge tone="accent">
              <IconSpark style={{ width: 12, height: 12 }} /> On this device
            </Badge>
          )
        }
      />

      {/* Three dominant actions */}
      <div className="stack stack--sm" style={{ marginBottom: '1.25rem' }}>
        <Link to="/record" className="action-card action-card--primary">
          <span className="action-card__icon" aria-hidden="true">
            <IconPlus />
          </span>
          <span>
            <span className="action-card__label">Record a Change</span>
            <span className="action-card__desc">What you noticed, where, and when — a few calm steps.</span>
          </span>
        </Link>

        <div className="grid-2">
          <Link to="/prepare" className="action-card">
            <span className="action-card__icon action-card__icon--ink" aria-hidden="true">
              <IconPrep />
            </span>
            <span>
              <span className="action-card__label">Prepare for a Visit</span>
              <span className="action-card__desc">Organize what you want to discuss.</span>
            </span>
          </Link>
          <Link to="/timeline" className="action-card">
            <span className="action-card__icon" aria-hidden="true">
              <IconTimeline />
            </span>
            <span>
              <span className="action-card__label">Review My Timeline</span>
              <span className="action-card__desc">Your history, in order.</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Personalized next step */}
      <div className="card" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 16rem' }}>
            <p className="card__title" style={{ marginBottom: '0.35rem' }}>
              {status.kind === 'upcoming-visit'
                ? 'Upcoming visit'
                : status.kind === 'no-baseline'
                  ? 'Getting started'
                  : status.kind === 'baseline-no-obs'
                    ? 'Baseline ready'
                    : 'Next useful step'}
            </p>
            <p style={{ margin: 0, fontWeight: 550 }}>{status.message}</p>
          </div>
          <LinkButton to={status.actionTo} variant="secondary" size="sm">
            {status.actionLabel} <IconChevronRight style={{ width: 15, height: 15 }} />
          </LinkButton>
        </div>
      </div>

      <div className="grid-2 grid-2--wide-left">
        {/* Recent activity */}
        <section aria-labelledby="recent-h" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
            <h2 id="recent-h" style={{ fontSize: 'var(--fs-lg)', margin: 0, fontFamily: 'var(--font-body)', fontWeight: 700 }}>
              Recent activity
            </h2>
            <Link to="/timeline" className="small">
              View timeline
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="muted small" style={{ marginTop: '0.75rem' }}>
              Nothing yet. Your activity will appear here as you record observations, questions, appointments, and
              screenings.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.65rem' }}>
              {events.map((e) => (
                <li key={e.key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                  <span className="small muted" style={{ minWidth: '6.5rem', flexShrink: 0 }}>
                    {e.displayDate}
                  </span>
                  <span style={{ fontSize: 'var(--fs-base)' }}>
                    <strong style={{ fontWeight: 650 }}>{e.title}</strong>
                    <span className="muted small" style={{ display: 'block' }}>
                      {e.subtitle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="stack stack--sm">
          {/* Status snapshot */}
          <section className="card" aria-labelledby="status-h">
            <p className="card__title" id="status-h">
              My Normal &amp; records
            </p>
            <div className="stat-row">
              <div className="stat">
                <div className="stat__num">{data.baseline ? 'Ready' : '—'}</div>
                <div className="stat__label">Baseline</div>
              </div>
              <div className="stat">
                <div className="stat__num">{data.observations.length}</div>
                <div className="stat__label">Observations</div>
              </div>
              <div className="stat">
                <div className="stat__num">{openQs}</div>
                <div className="stat__label">Open questions</div>
              </div>
            </div>
            <div className="btn-row mt-4">
              <Link to="/my-normal" className="btn btn--ghost btn--sm">
                <IconEye style={{ width: 16, height: 16 }} /> My Normal
              </Link>
              <Link to="/questions" className="btn btn--ghost btn--sm">
                <IconQuestion style={{ width: 16, height: 16 }} /> Questions
              </Link>
            </div>
          </section>

          {/* Upcoming appointment */}
          {up && data.settings.showAppointmentHints ? (
            <section className="card" aria-labelledby="appt-h">
              <p className="card__title" id="appt-h">
                Upcoming appointment
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span className="action-card__icon" style={{ width: 40, height: 40, borderRadius: 11 }}>
                  <IconCalendar style={{ width: 19, height: 19 }} />
                </span>
                <div>
                  <strong>{up.appointment.title}</strong>
                  <div className="small muted">{formatDateTime(up.appointment.datetime)}</div>
                  {up.appointment.provider && <div className="small muted">{up.appointment.provider}</div>}
                  <Badge tone={daysUntil(up.appointment.datetime.slice(0, 10)) !== null && (daysUntil(up.appointment.datetime.slice(0, 10)) ?? 99) <= 7 ? 'warm' : 'accent'}>
                    {up.days <= 0 ? 'Today' : `In ${up.days} day${up.days === 1 ? '' : 's'}`}
                  </Badge>
                </div>
              </div>
              <Link to="/prepare" className="btn btn--secondary btn--sm mt-4">
                Continue preparing
              </Link>
            </section>
          ) : (
            <section className="card" aria-labelledby="appt-h">
              <p className="card__title" id="appt-h">
                Upcoming appointment
              </p>
              <p className="small muted" style={{ margin: 0 }}>
                No appointment recorded.{' '}
                <Link to="/screening">Add one in Screening &amp; Appointments</Link>.
              </p>
            </section>
          )}

          {/* Shortcuts */}
          <section className="card" aria-label="Shortcuts">
            <div className="stack stack--sm">
              <Link to="/screening" className="action-card" style={{ padding: '0.85rem 1rem' }}>
                <span className="action-card__icon" style={{ width: 38, height: 38, borderRadius: 10 }} aria-hidden="true">
                  <IconScreening style={{ width: 18, height: 18 }} />
                </span>
                <span>
                  <span className="action-card__label" style={{ fontSize: 'var(--fs-base)' }}>
                    Screening history
                  </span>
                  <span className="action-card__desc">{data.screenings.length} record{data.screenings.length === 1 ? '' : 's'}</span>
                </span>
              </Link>
              <Link to={lastSummary ? `/summary/${lastSummary.id}` : '/summary'} className="action-card" style={{ padding: '0.85rem 1rem' }}>
                <span className="action-card__icon action-card__icon--ink" style={{ width: 38, height: 38, borderRadius: 10 }} aria-hidden="true">
                  <IconDoc style={{ width: 18, height: 18 }} />
                </span>
                <span>
                  <span className="action-card__label" style={{ fontSize: 'var(--fs-base)' }}>
                    Health summary
                  </span>
                  <span className="action-card__desc">
                    {lastSummary ? `Last created ${formatDay(lastSummary.createdAt.slice(0, 10))}` : 'Create from a visit prep'}
                  </span>
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
