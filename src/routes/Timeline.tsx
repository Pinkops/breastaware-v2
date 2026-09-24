import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { buildTimeline, filterTimeline, type TimelineFilter } from '../lib/selectors';
import { EmptyState, LinkButton, PageHead, SegmentedControl } from '../components/primitives';
import {
  IconCalendar,
  IconChevronRight,
  IconPlus,
  IconQuestion,
  IconScreening,
  IconTimeline,
} from '../components/icons';

const FILTERS: Array<{ id: TimelineFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'observation', label: 'Changes' },
  { id: 'question', label: 'Questions' },
  { id: 'appointment', label: 'Appointments' },
  { id: 'screening', label: 'Screening' },
];

function sourceHref(type: string, id: string): string {
  switch (type) {
    case 'observation':
      return `/observations/${id}`;
    case 'question':
      return `/questions?focus=${id}`;
    case 'appointment':
      return `/screening?focus=${id}`;
    case 'screening':
      return `/screening?focus=${id}`;
    default:
      return '/timeline';
  }
}

function typeIcon(type: string) {
  switch (type) {
    case 'observation':
      return <IconPlus />;
    case 'question':
      return <IconQuestion />;
    case 'appointment':
      return <IconCalendar />;
    default:
      return <IconScreening />;
  }
}

export function TimelinePage() {
  const { data } = useApp();
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const events = useMemo(() => (data ? buildTimeline(data) : []), [data]);
  const visible = useMemo(() => filterTimeline(events, filter), [events, filter]);

  if (!data) return null;

  if (events.length === 0) {
    return (
      <>
        <PageHead
          eyebrow="Organize"
          title="My Timeline"
          lede="Observations, questions, appointments, and screening records — one personal history, not scattered notes."
        />
        <EmptyState
          title="Your timeline will appear here"
          icon={<IconTimeline />}
          action={
            <LinkButton to="/record">
              <IconPlus style={{ width: 16, height: 16 }} /> Record a Change
            </LinkButton>
          }
        >
          Your timeline will appear here as you add observations, questions, appointments, and screening records.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Organize"
        title="My Timeline"
        lede="Everything you have recorded, in order. Open any entry to see its source record."
        actions={
          <LinkButton to="/record" size="sm">
            <IconPlus style={{ width: 15, height: 15 }} /> Record a Change
          </LinkButton>
        }
      />

      <div style={{ marginBottom: '1.25rem', overflowX: 'auto' }} className="no-print">
        <SegmentedControl label="Filter timeline" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <p className="sr-only" role="status">
        {visible.length} {filter === 'all' ? 'entries' : FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} shown.
      </p>

      <div className="timeline">
        {visible.length === 0 ? (
          <EmptyState title="Nothing in this filter yet" icon={<IconTimeline />}>
            Try another filter, or record something new.
          </EmptyState>
        ) : (
          visible.map((e) => (
            <div className="tl-day" key={e.key}>
              <div className="tl-day__date">{e.displayDate}</div>
              <div className="tl-day__content">
                <Link to={sourceHref(e.type, e.sourceId)} className="tl-item">
                  <div className="tl-item__type">
                    {typeIcon(e.type)}
                    {e.type === 'observation' ? 'Change' : e.type === 'question' ? 'Question' : e.type === 'appointment' ? 'Appointment' : 'Screening'}
                  </div>
                  <div className="tl-item__title">{e.title}</div>
                  <div className="tl-item__sub">{e.subtitle}</div>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {visible.length > 0 && (
        <p className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconChevronRight style={{ width: 14, height: 14 }} /> Select any entry to open its full record.
        </p>
      )}
    </>
  );
}
