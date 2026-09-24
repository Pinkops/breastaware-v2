import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Field,
  LinkButton,
  PageHead,
  Select,
  TextArea,
  TextInput,
} from '../components/primitives';
import { IconCalendar, IconPlus, IconScreening, IconTrash } from '../components/icons';
import { formatDay, formatDateTime, friendlyError, nowISO, todayISODate, uid } from '../lib/util';
import { SCREENING_TYPES } from '../lib/types';

type Tab = 'appointments' | 'screening';

export function ScreeningPage() {
  const { data, update } = useApp();
  const [params] = useSearchParams();
  const focusId = params.get('focus');
  const initialTab: Tab =
    focusId && data && data.screenings.some((s) => s.id === focusId) ? 'screening' : 'appointments';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [addingAppt, setAddingAppt] = useState(false);
  const [addingScreen, setAddingScreen] = useState(false);
  const [error, setError] = useState('');

  const [appt, setAppt] = useState({
    title: '',
    datetime: '',
    provider: '',
    location: '',
    notes: '',
    reminderNote: '',
  });

  const [scr, setScr] = useState({
    type: 'Mammogram',
    date: todayISODate(),
    facility: '',
    notes: '',
  });

  if (!data) return null;

  function addAppt(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!appt.title.trim() || !appt.datetime) {
      setError('Add a title and date/time for the appointment.');
      return;
    }
    try {
      update((d) => ({
        ...d,
        appointments: [
          { id: uid(), ...appt, title: appt.title.trim(), createdAt: nowISO() },
          ...d.appointments,
        ],
      }));
      setAppt({ title: '', datetime: '', provider: '', location: '', notes: '', reminderNote: '' });
      setAddingAppt(false);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function addScreen(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!scr.date || !scr.type) {
      setError('Add the screening type and date.');
      return;
    }
    try {
      update((d) => ({
        ...d,
        screenings: [
          { id: uid(), ...scr, facility: scr.facility.trim(), createdAt: nowISO() },
          ...d.screenings,
        ],
      }));
      setScr({ type: 'Mammogram', date: todayISODate(), facility: '', notes: '' });
      setAddingScreen(false);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const appointments = [...data.appointments].sort((a, b) => (a.datetime > b.datetime ? 1 : -1));
  const screenings = [...data.screenings].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <PageHead
        eyebrow="Organize"
        title="Screening & Appointments"
        lede="Personal record keeping for screenings and visits — not a schedule of what you should do."
        actions={
          tab === 'appointments' ? (
            <Button onClick={() => setAddingAppt(true)}>
              <IconPlus style={{ width: 16, height: 16 }} /> Record appointment
            </Button>
          ) : (
            <Button onClick={() => setAddingScreen(true)}>
              <IconPlus style={{ width: 16, height: 16 }} /> Record screening
            </Button>
          )
        }
      />

      <Banner tone="info">
        Screening guidance can vary based on personal circumstances and location. Check current guidance from your
        healthcare professional or local screening program.{' '}
        <Link to="/education/screening-basics">Screening basics →</Link>
      </Banner>

      <div className="seg seg--block mt-4 mb-4 no-print" role="tablist" aria-label="Record type" style={{ display: 'grid' }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'appointments'}
          className="seg__btn"
          onClick={() => setTab('appointments')}
        >
          <IconCalendar style={{ width: 15, height: 15, verticalAlign: '-3px', marginRight: 6 }} />
          Appointments ({appointments.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'screening'}
          className="seg__btn"
          onClick={() => setTab('screening')}
        >
          <IconScreening style={{ width: 15, height: 15, verticalAlign: '-3px', marginRight: 6 }} />
          Screening history ({screenings.length})
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Banner tone="danger">{error}</Banner>
        </div>
      )}

      {tab === 'appointments' && (
        <section aria-label="Appointments">
          {addingAppt && (
            <form onSubmit={addAppt} className="card" style={{ marginBottom: '1rem' }}>
              <p className="card__title">New appointment</p>
              <div className="grid-2">
                <Field label="Title" htmlFor="appt-title" hint="e.g. GP visit, specialist follow-up">
                  <TextInput
                    id="appt-title"
                    autoFocus
                    required
                    value={appt.title}
                    onChange={(e) => setAppt({ ...appt, title: e.target.value })}
                    placeholder="Routine appointment"
                  />
                </Field>
                <Field label="Date & time" htmlFor="appt-dt">
                  <TextInput
                    id="appt-dt"
                    type="datetime-local"
                    required
                    value={appt.datetime}
                    onChange={(e) => setAppt({ ...appt, datetime: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid-2">
                <Field label="Healthcare professional / provider" htmlFor="appt-provider" optional>
                  <TextInput
                    id="appt-provider"
                    value={appt.provider}
                    onChange={(e) => setAppt({ ...appt, provider: e.target.value })}
                  />
                </Field>
                <Field label="Location" htmlFor="appt-loc" optional>
                  <TextInput
                    id="appt-loc"
                    value={appt.location}
                    onChange={(e) => setAppt({ ...appt, location: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Notes" htmlFor="appt-notes" optional>
                <TextArea id="appt-notes" rows={2} value={appt.notes} onChange={(e) => setAppt({ ...appt, notes: e.target.value })} />
              </Field>
              <Field
                label="Personal reminder note"
                htmlFor="appt-rem"
                optional
                hint="Shown on your Home screen when the appointment is near. No push notifications are sent."
              >
                <TextInput
                  id="appt-rem"
                  value={appt.reminderNote}
                  onChange={(e) => setAppt({ ...appt, reminderNote: e.target.value })}
                  placeholder="e.g. Bring my summary printout"
                />
              </Field>
              <div className="btn-row">
                <Button type="submit">Save appointment</Button>
                <Button variant="ghost" onClick={() => setAddingAppt(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {appointments.length === 0 && !addingAppt ? (
            <EmptyState
              title="No appointments recorded"
              icon={<IconCalendar />}
              action={
                <Button onClick={() => setAddingAppt(true)}>
                  <IconPlus style={{ width: 16, height: 16 }} /> Record appointment
                </Button>
              }
            >
              Add an appointment to see it on Home and link it to a visit preparation.
            </EmptyState>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {appointments.map((a) => (
                <li key={a.id} className="list-item" style={focusId === a.id ? { borderColor: 'var(--accent)' } : undefined}>
                  <div className="list-item__body">
                    <div className="list-item__title">{a.title}</div>
                    <div className="list-item__meta">
                      <Badge tone="accent">{formatDateTime(a.datetime)}</Badge>
                      {a.provider && <span>{a.provider}</span>}
                      {a.location && <span>{a.location}</span>}
                    </div>
                    {a.notes && <p className="small" style={{ marginTop: '0.4rem', marginBottom: 0 }}>{a.notes}</p>}
                    {a.reminderNote && (
                      <p className="small muted" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                        Reminder: {a.reminderNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={`Delete appointment ${a.title}`}
                    onClick={() => {
                      if (window.confirm('Delete this appointment?')) {
                        update((d) => ({
                          ...d,
                          appointments: d.appointments.filter((x) => x.id !== a.id),
                          preparations: d.preparations.map((p) =>
                            p.appointmentId === a.id ? { ...p, appointmentId: null } : p,
                          ),
                        }));
                      }
                    }}
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'screening' && (
        <section aria-label="Screening history">
          {addingScreen && (
            <form onSubmit={addScreen} className="card" style={{ marginBottom: '1rem' }}>
              <p className="card__title">New screening record</p>
              <div className="grid-2">
                <Field label="Screening type" htmlFor="scr-type">
                  <Select id="scr-type" value={scr.type} onChange={(e) => setScr({ ...scr, type: e.target.value })}>
                    {SCREENING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date" htmlFor="scr-date">
                  <TextInput
                    id="scr-date"
                    type="date"
                    max={todayISODate()}
                    required
                    value={scr.date}
                    onChange={(e) => setScr({ ...scr, date: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Facility / provider" htmlFor="scr-fac" optional>
                <TextInput id="scr-fac" value={scr.facility} onChange={(e) => setScr({ ...scr, facility: e.target.value })} />
              </Field>
              <Field label="Notes" htmlFor="scr-notes" optional hint="What you want to remember about this record.">
                <TextArea id="scr-notes" rows={3} value={scr.notes} onChange={(e) => setScr({ ...scr, notes: e.target.value })} />
              </Field>
              <div className="btn-row">
                <Button type="submit">Save screening</Button>
                <Button variant="ghost" onClick={() => setAddingScreen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {screenings.length === 0 && !addingScreen ? (
            <EmptyState
              title="No screening records yet"
              icon={<IconScreening />}
              action={
                <Button onClick={() => setAddingScreen(true)}>
                  <IconPlus style={{ width: 16, height: 16 }} /> Record screening
                </Button>
              }
            >
              Keep a personal history of screenings you have had — type, date, facility, and your own notes. This app
              never tells you which screening you need.
            </EmptyState>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {screenings.map((s) => (
                <li key={s.id} className="list-item" style={focusId === s.id ? { borderColor: 'var(--accent)' } : undefined}>
                  <div className="list-item__body">
                    <div className="list-item__title">{s.type}</div>
                    <div className="list-item__meta">
                      <Badge>{formatDay(s.date)}</Badge>
                      {s.facility && <span>{s.facility}</span>}
                    </div>
                    {s.notes && <p className="small" style={{ marginTop: '0.4rem', marginBottom: 0 }}>{s.notes}</p>}
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={`Delete screening record ${s.type}`}
                    onClick={() => {
                      if (window.confirm('Delete this screening record?')) {
                        update((d) => ({ ...d, screenings: d.screenings.filter((x) => x.id !== s.id) }));
                      }
                    }}
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="card mt-6">
        <p className="card__title">About screening information</p>
        <p className="small mb-0">
          BreastAware does not automatically determine personalized screening schedules and never implies
          &ldquo;BreastAware says you need this screening.&rdquo; Educational information lives in{' '}
          <Link to="/education">Education</Link> with sources and dates attached.
        </p>
      </div>

      <div className="btn-row mt-4">
        <LinkButton to="/prepare" variant="secondary" size="sm">
          Use these in a visit prep
        </LinkButton>
      </div>
    </>
  );
}
