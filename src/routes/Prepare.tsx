import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { newPreparation } from '../lib/store';
import { buildVisitSummary } from '../lib/summary';
import { categoryLabel } from '../lib/selectors';
import {
  Badge,
  Banner,
  Button,
  CheckRow,
  EmptyState,
  Field,
  LinkButton,
  PageHead,
  Select,
  TextArea,
} from '../components/primitives';
import { IconCalendar, IconCheck, IconDoc, IconPlus, IconPrep, IconQuestion, IconScreening, IconTrash } from '../components/icons';
import { formatDay, formatDateTime, nowISO } from '../lib/util';

const STEPS = [
  { key: 'reason', label: 'Why am I going?' },
  { key: 'observations', label: 'What have I noticed?' },
  { key: 'questions', label: 'Questions I want to ask' },
  { key: 'history', label: 'Relevant personal history' },
  { key: 'medications', label: 'Medications / supplements' },
  { key: 'screening', label: 'Previous screening' },
  { key: 'appointment', label: 'Appointment details' },
  { key: 'remember', label: 'What do I want to remember?' },
  { key: 'review', label: 'Review & create summary' },
] as const;

/* ---------------- List / entry point ---------------- */

export function PrepareListPage() {
  const { data, update } = useApp();
  const navigate = useNavigate();
  if (!data) return null;

  const open = data.preparations.filter((p) => p.status === 'in-progress');
  const done = data.preparations.filter((p) => p.status === 'completed');

  function startNew() {
    const prep = newPreparation();
    update((d) => ({ ...d, preparations: [prep, ...d.preparations] }));
    navigate(`/prepare/${prep.id}`);
  }

  return (
    <>
      <PageHead
        eyebrow="Prepare"
        title="Prepare for a Visit"
        lede="I have a healthcare visit coming up. Help me organize what I want to discuss — one coherent workflow, from reason to printable summary."
        actions={
          <Button onClick={startNew}>
            <IconPlus style={{ width: 16, height: 16 }} /> Start a visit prep
          </Button>
        }
      />

      {open.length === 0 && done.length === 0 ? (
        <EmptyState
          title="Nothing prepared yet"
          icon={<IconPrep />}
          action={
            <Button onClick={startNew} size="lg">
              Prepare for a Visit
            </Button>
          }
        >
          Gather your observations, questions, history, and screening records into one brief — then create a health
          summary you can print or read at your appointment.
        </EmptyState>
      ) : (
        <>
          {open.length > 0 && (
            <section aria-labelledby="open-preps" className="stack stack--sm">
              <h2 id="open-preps" style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                In progress
              </h2>
              {open.map((p) => (
                <Link key={p.id} to={`/prepare/${p.id}`} className="card card-link">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.reason.trim() || 'Untitled visit preparation'}</div>
                      <div className="small muted">
                        {p.observationIds.length} change{p.observationIds.length === 1 ? '' : 's'} ·{' '}
                        {p.questionIds.length} question{p.questionIds.length === 1 ? '' : 's'} · updated{' '}
                        {formatDay(p.updatedAt.slice(0, 10))}
                      </div>
                    </div>
                    <Badge tone="accent">Continue</Badge>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {done.length > 0 && (
            <section aria-labelledby="done-preps" className="stack stack--sm mt-6">
              <h2 id="done-preps" style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                Completed
              </h2>
              {done.map((p) => {
                const summary = data.summaries.find((s) => s.sourcePrepId === p.id);
                return (
                  <div key={p.id} className="list-item">
                    <div className="list-item__body">
                      <div className="list-item__title">{p.reason.trim() || 'Visit preparation'}</div>
                      <div className="small muted">Updated {formatDay(p.updatedAt.slice(0, 10))}</div>
                    </div>
                    <div className="list-item__actions" style={{ marginTop: 0 }}>
                      {summary && (
                        <Link to={`/summary/${summary.id}`} className="btn btn--secondary btn--sm">
                          <IconDoc style={{ width: 14, height: 14 }} /> View summary
                        </Link>
                      )}
                      <Link to={`/prepare/${p.id}`} className="btn btn--ghost btn--sm">
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <div className="mt-6">
            <Button variant="secondary" onClick={startNew}>
              <IconPlus style={{ width: 16, height: 16 }} /> Start another visit preparation
            </Button>
          </div>
        </>
      )}

      <div className="grid-2 mt-6">
        <div className="card">
          <p className="card__title">Quick links</p>
          <div className="btn-row">
            <LinkButton to="/questions" variant="secondary" size="sm">
              Questions
            </LinkButton>
            <LinkButton to="/timeline" variant="secondary" size="sm">
              My Timeline
            </LinkButton>
            <LinkButton to="/screening" variant="secondary" size="sm">
              Screening records
            </LinkButton>
          </div>
        </div>
        <div className="card">
          <p className="card__title">Your health summary</p>
          {data.summaries.length > 0 ? (
            <Link to={`/summary/${data.summaries[0].id}`}>
              Last summary: {formatDay(data.summaries[0].createdAt.slice(0, 10))}
            </Link>
          ) : (
            <p className="small muted mb-0">
              Summaries are created at the end of a visit prep. They contain only what you entered.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Wizard ---------------- */

export function PrepareWizardPage() {
  const { id } = useParams();
  const { data, update } = useApp();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const prep = data?.preparations.find((p) => p.id === id);

  const stepKey = STEPS[stepIndex]?.key ?? 'reason';

  const doneFlags = useMemo(() => {
    if (!prep || !data) return new Array(STEPS.length).fill(false);
    return [
      prep.reason.trim().length > 0,
      prep.observationIds.length > 0,
      prep.questionIds.length > 0 || data.questions.length === 0,
      prep.historyNotes.trim().length > 0,
      prep.medicationNotes.trim().length > 0,
      prep.screeningNotes.trim().length > 0 || data.screenings.length > 0,
      Boolean(prep.appointmentId) || data.appointments.length === 0,
      prep.rememberNotes.trim().length > 0,
      prep.reason.trim().length > 0,
    ];
  }, [prep, data]);

  if (!data) return null;
  if (!prep) {
    return (
      <>
        <PageHead title="Preparation not found" />
        <Banner tone="warn">
          This visit preparation is not in your records. <Link to="/prepare">Back to Prepare for a Visit</Link>.
        </Banner>
      </>
    );
  }

  function patch(part: Partial<typeof prep>) {
    if (!prep) return;
    update((d) => ({
      ...d,
      preparations: d.preparations.map((p) => (p.id === prep.id ? { ...p, ...part, updatedAt: nowISO() } : p)),
    }));
  }

  function go(delta: number) {
    setStepIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function createSummary() {
    if (!prep || creating) return;
    if (!prep.reason.trim()) {
      setError('Add a short reason for the visit before creating your summary.');
      setStepIndex(0);
      return;
    }
    setCreating(true);
    setError('');
    try {
      const summary = buildVisitSummary(data!, prep);
      update((d) => ({
        ...d,
        summaries: [summary, ...d.summaries],
        preparations: d.preparations.map((p) =>
          p.id === prep.id ? { ...p, status: 'completed' as const, updatedAt: nowISO() } : p,
        ),
      }));
      navigate(`/summary/${summary.id}`);
    } catch {
      setError("We couldn't create the summary. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Link to="/prepare" className="back-link no-print">
        ‹ All visit preparations
      </Link>

      <PageHead
        eyebrow="Prepare for a Visit"
        title={prep.reason.trim() ? prep.reason.trim().slice(0, 80) : 'Your visit brief'}
        lede="Work through each section at your own pace. Everything saves as you go."
      />

      <div className="grid-2 grid-2--wide-left" style={{ alignItems: 'start' }}>
        {/* Step rail */}
        <nav aria-label="Preparation steps" className="step-rail no-print" style={{ order: 2 }}>
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`step-rail__item${i === stepIndex ? ' step-rail__item--active' : ''}${doneFlags[i] && i !== stepIndex ? ' step-rail__item--done' : ''}`}
              aria-current={i === stepIndex ? 'step' : undefined}
              onClick={() => setStepIndex(i)}
              style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 650, border: '1px solid transparent', width: '100%' }}
            >
              <span className="step-rail__dot" aria-hidden="true">
                {doneFlags[i] && i !== stepIndex ? <IconCheck style={{ width: 12, height: 12 }} /> : i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Step panel */}
        <div className="card card--pad-lg" style={{ order: 1 }}>
          <div className="wizard-step-label">
            Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
          </div>

          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}

          {stepKey === 'reason' && (
            <Field
              label="Why am I going?"
              htmlFor="reason"
              hint="A sentence in your own words — e.g. 'Follow-up about tenderness' or 'Routine visit, bringing my questions.'"
            >
              <TextArea
                id="reason"
                rows={3}
                value={prep.reason}
                maxLength={400}
                onChange={(e) => patch({ reason: e.target.value })}
                placeholder="Reason for this visit…"
              />
            </Field>
          )}

          {stepKey === 'observations' && (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label">Relevant observations</legend>
              <p className="hint">Pick the changes you want to discuss at this visit.</p>
              {data.observations.length === 0 ? (
                <Banner tone="info">
                  No observations yet. <Link to="/record">Record a Change</Link> first, then come back.
                </Banner>
              ) : (
                <div>
                  {[...data.observations]
                    .sort((a, b) => (a.dateFirstNoticed < b.dateFirstNoticed ? 1 : -1))
                    .map((o) => (
                      <CheckRow
                        key={o.id}
                        id={`obs-${o.id}`}
                        checked={prep.observationIds.includes(o.id)}
                        onChange={(on) =>
                          patch({
                            observationIds: on
                              ? [...prep.observationIds, o.id]
                              : prep.observationIds.filter((x) => x !== o.id),
                          })
                        }
                      >
                        <strong>{categoryLabel(o.category)}</strong> · {o.side} · {formatDay(o.dateFirstNoticed)}
                        {o.notes.trim() && (
                          <span className="small muted" style={{ display: 'block' }}>
                            {o.notes.length > 110 ? `${o.notes.slice(0, 110)}…` : o.notes}
                          </span>
                        )}
                      </CheckRow>
                    ))}
                </div>
              )}
            </fieldset>
          )}

          {stepKey === 'questions' && (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label">Questions I want to ask</legend>
              <p className="hint">
                Questions marked &ldquo;include in summary&rdquo; on the{' '}
                <Link to="/questions">Questions page</Link> are the ones that will appear.
              </p>
              {data.questions.length === 0 ? (
                <Banner tone="info">
                  No questions yet. <Link to="/questions">Add a question</Link> so you don&rsquo;t have to rely on
                  memory.
                </Banner>
              ) : (
                <div>
                  {[...data.questions].map((q) => (
                    <CheckRow
                      key={q.id}
                      id={`pq-${q.id}`}
                      checked={prep.questionIds.includes(q.id)}
                      onChange={(on) =>
                        patch({
                          questionIds: on
                            ? [...prep.questionIds, q.id]
                            : prep.questionIds.filter((x) => x !== q.id),
                        })
                      }
                    >
                      {q.priority === 'important' && <Badge tone="warm">Important</Badge>} {q.text}
                    </CheckRow>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {stepKey === 'history' && (
            <Field
              label="Relevant personal history"
              htmlFor="history"
              hint="Previous procedures, family context you consider relevant, anything the clinician should know. Only what you choose to write."
            >
              <TextArea
                id="history"
                rows={4}
                value={prep.historyNotes}
                maxLength={3000}
                onChange={(e) => patch({ historyNotes: e.target.value })}
                placeholder="e.g. No prior breast procedures; mother had a benign biopsy…"
              />
            </Field>
          )}

          {stepKey === 'medications' && (
            <Field
              label="Medications / supplements"
              htmlFor="meds"
              hint="List what you take — this is your note to yourself; the app does not verify or advise on medications."
            >
              <TextArea
                id="meds"
                rows={4}
                value={prep.medicationNotes}
                maxLength={3000}
                onChange={(e) => patch({ medicationNotes: e.target.value })}
                placeholder="e.g. Multivitamin daily…"
              />
            </Field>
          )}

          {stepKey === 'screening' && (
            <>
              <div className="field">
                <p className="label">Recorded screening (from your records)</p>
                {data.screenings.length === 0 ? (
                  <p className="hint">
                    Nothing recorded yet.{' '}
                    <Link to="/screening">
                      Add a screening record
                    </Link>{' '}
                    if you have one.
                  </p>
                ) : (
                  <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                    {[...data.screenings]
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((s) => (
                        <li key={s.id} style={{ marginBottom: '0.35rem' }}>
                          {formatDay(s.date)} — {s.type}
                          {s.facility ? ` · ${s.facility}` : ''}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <Field
                label="Screening notes"
                htmlFor="scr-notes"
                hint="Anything about screening you want to raise. BreastAware does not recommend screenings for you."
                optional
              >
                <TextArea
                  id="scr-notes"
                  rows={3}
                  value={prep.screeningNotes}
                  maxLength={2000}
                  onChange={(e) => patch({ screeningNotes: e.target.value })}
                  placeholder="e.g. Not sure when I am next due…"
                />
              </Field>
            </>
          )}

          {stepKey === 'appointment' && (
            <>
              <Field label="Linked appointment" htmlFor="appt-link" optional hint="Choose one of your recorded appointments.">
                <Select
                  id="appt-link"
                  value={prep.appointmentId ?? ''}
                  onChange={(e) => patch({ appointmentId: e.target.value || null })}
                >
                  <option value="">No linked appointment</option>
                  {data.appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} — {formatDateTime(a.datetime)}
                    </option>
                  ))}
                </Select>
              </Field>
              {data.appointments.length === 0 && (
                <Banner tone="info">
                  No appointments recorded. <Link to="/screening">Add one in Screening &amp; Appointments</Link>.
                </Banner>
              )}
            </>
          )}

          {stepKey === 'remember' && (
            <Field
              label="What do I want to remember?"
              htmlFor="remember"
              hint="Closing thoughts, next steps to ask for, parking notes — anything."
              optional
            >
              <TextArea
                id="remember"
                rows={4}
                value={prep.rememberNotes}
                maxLength={3000}
                onChange={(e) => patch({ rememberNotes: e.target.value })}
                placeholder="e.g. Ask about when to return for my next screening…"
              />
            </Field>
          )}

          {stepKey === 'review' && (
            <div>
              <p className="card__title">Review</p>
              <dl className="dl">
                <div className="dl__row">
                  <dt>Reason</dt>
                  <dd>{prep.reason.trim() || <span className="not-provided muted">Not provided</span>}</dd>
                </div>
                <div className="dl__row">
                  <dt>Changes selected</dt>
                  <dd>
                    {prep.observationIds.length === 0
                      ? 'None'
                      : prep.observationIds
                          .map((oid) => data.observations.find((o) => o.id === oid))
                          .filter(Boolean)
                          .map((o) => `${categoryLabel(o!.category)} (${formatDay(o!.dateFirstNoticed)})`)
                          .join(', ')}
                  </dd>
                </div>
                <div className="dl__row">
                  <dt>Questions included</dt>
                  <dd>{prep.questionIds.length === 0 ? 'None' : `${prep.questionIds.length} selected`}</dd>
                </div>
                <div className="dl__row">
                  <dt>History</dt>
                  <dd>{prep.historyNotes.trim() || <span className="muted">Not provided</span>}</dd>
                </div>
                <div className="dl__row">
                  <dt>Medications</dt>
                  <dd>{prep.medicationNotes.trim() || <span className="muted">Not provided</span>}</dd>
                </div>
                <div className="dl__row">
                  <dt>Appointment</dt>
                  <dd>
                    {prep.appointmentId
                      ? (() => {
                          const a = data.appointments.find((x) => x.id === prep.appointmentId);
                          return a ? `${a.title} — ${formatDateTime(a.datetime)}` : 'Not found';
                        })()
                      : <span className="muted">Not provided</span>}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <Banner tone="info">
                  The summary is generated only from what you entered. Missing sections show &ldquo;Not provided&rdquo;
                  — nothing is invented.
                </Banner>
              </div>

              <div className="btn-row mt-6">
                <Button size="lg" onClick={createSummary} disabled={creating}>
                  <IconDoc style={{ width: 17, height: 17 }} /> {creating ? 'Creating…' : 'Create My Health Summary'}
                </Button>
              </div>
            </div>
          )}

          {/* Wizard nav */}
          <div className="wizard-nav no-print">
            <Button variant="ghost" onClick={() => go(-1)} disabled={stepIndex === 0}>
              Back
            </Button>
            <span className="spacer" />
            {stepIndex < STEPS.length - 1 && (
              <Button onClick={() => go(1)} variant={stepKey === 'review' ? 'secondary' : 'primary'}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="btn-row mt-6 no-print">
        <Button
          variant="danger-outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Delete this visit preparation? Your underlying records are kept.')) {
              update((d) => ({
                ...d,
                preparations: d.preparations.filter((p) => p.id !== prep.id),
              }));
              navigate('/prepare');
            }
          }}
        >
          <IconTrash style={{ width: 14, height: 14 }} /> Delete this prep
        </Button>
      </div>
    </>
  );
}

export { IconCalendar, IconPlus, IconQuestion, IconScreening };
