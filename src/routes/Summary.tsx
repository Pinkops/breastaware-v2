import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { newPreparation } from '../lib/store';
import { categoryLabel } from '../lib/selectors';
import { summaryToText } from '../lib/summary';
import { exportSummaryText } from '../lib/export';
import { Badge, Button, EmptyState, LinkButton, PageHead } from '../components/primitives';
import { IconDoc, IconDownload, IconPlus, IconPrep, IconPrint } from '../components/icons';
import { formatDay } from '../lib/util';
import type { VisitSummary } from '../lib/types';

/* ---------------- List ---------------- */

export function SummaryListPage() {
  const { data } = useApp();
  if (!data) return null;

  if (data.summaries.length === 0) {
    return (
      <>
        <PageHead
          eyebrow="Summarize"
          title="Health Summary"
          lede="Your visit summaries live here once you finish a visit preparation."
        />
        <EmptyState
          title="No summaries yet"
          icon={<IconDoc />}
          action={
            <LinkButton to="/prepare">
              <IconPrep style={{ width: 16, height: 16 }} /> Prepare for a Visit
            </LinkButton>
          }
        >
          Complete a visit preparation and choose &ldquo;Create My Health Summary&rdquo; — it will be built strictly
          from the information you entered.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Summarize"
        title="Health Summary"
        lede="Each summary is a snapshot of your records at the moment you created it."
        actions={
          <LinkButton to="/prepare" size="sm">
            <IconPlus style={{ width: 15, height: 15 }} /> New visit prep
          </LinkButton>
        }
      />
      <div className="stack stack--sm">
        {data.summaries.map((s) => (
          <Link key={s.id} to={`/summary/${s.id}`} className="card card-link">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{formatDay(s.createdAt.slice(0, 10))}</div>
                <div className="small muted">
                  {s.changesToDiscuss.length} change{s.changesToDiscuss.length === 1 ? '' : 's'} ·{' '}
                  {s.questions.length} question{s.questions.length === 1 ? '' : 's'} · prepared by {s.preparedBy}
                </div>
              </div>
              <Badge tone="accent">Open</Badge>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------------- Single summary (printable) ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="summary-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function NotProvided() {
  return <p className="not-provided">Not provided</p>;
}

function TextOrNone({ value }: { value: string }) {
  if (!value || value === 'Not provided') return <NotProvided />;
  return <p>{value}</p>;
}

export function SummaryViewPage() {
  const { id } = useParams();
  const { data, update, mode } = useApp();
  const navigate = useNavigate();
  if (!data) return null;

  const summary: VisitSummary | undefined = data.summaries.find((s) => s.id === id);

  if (!summary) {
    return (
      <>
        <PageHead title="Summary not found" />
        <div className="banner banner--warn" role="status">
          <div>
            This summary is not in your records. <Link to="/summary">View all summaries</Link>.
          </div>
        </div>
      </>
    );
  }

  function remove() {
    if (!window.confirm('Delete this summary permanently?')) return;
    update((d) => ({ ...d, summaries: d.summaries.filter((s) => s.id !== summary!.id) }));
    navigate('/summary');
  }

  function startAnother() {
    const prep = newPreparation();
    update((d) => ({ ...d, preparations: [prep, ...d.preparations] }));
    navigate(`/prepare/${prep.id}`);
  }

  return (
    <>
      <div className="no-print">
        <Link to="/summary" className="back-link">
          ‹ All summaries
        </Link>

        <PageHead
          eyebrow="Summarize"
          title="Visit Summary"
          lede={`Created ${formatDay(summary.createdAt.slice(0, 10))} from information you entered.`}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <IconPrint style={{ width: 15, height: 15 }} /> Print / Save as PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportSummaryText(summaryToText(summary))}>
                <IconDownload style={{ width: 15, height: 15 }} /> Download .txt
              </Button>
              <LinkButton to="/prepare" variant="ghost" size="sm">
                Edit source prep
              </LinkButton>
              <Button variant="danger-outline" size="sm" onClick={remove}>
                Delete
              </Button>
            </>
          }
        />
      </div>

      <article className="summary-sheet" aria-label="Breast health visit summary">
        {mode === 'demo' && <div className="summary-demo-mark">Sample demo — not a real consultation record</div>}
        <header className="summary-sheet__head">
          <div className="summary-sheet__kicker">BreastAware · Consultation Brief</div>
          <h1>Breast Health Visit Summary</h1>
          <p className="summary-sheet__intro">User-reported information organized for discussion with a healthcare professional.</p>
          <div className="summary-sheet__meta">
            <div>
              <strong>Prepared by</strong>
              {summary.preparedBy}
            </div>
            <div>
              <strong>Prepared on</strong>
              {formatDay(summary.createdAt.slice(0, 10))}
            </div>
            <div>
              <strong>Reference</strong>
              {summary.id.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </header>

        <Section title="Reason for visit">
          <TextOrNone value={summary.reasonForVisit} />
        </Section>

        <Section title="Changes I want to discuss">
          {summary.changesToDiscuss.length === 0 ? (
            <NotProvided />
          ) : (
            summary.changesToDiscuss.map((c) => (
              <div className="summary-change" key={c.id}>
                <div className="summary-change__head">{formatDay(c.date)} — {categoryLabel(c.category)}</div>
                <div className="summary-change__loc">{c.locationText}</div>
                {c.notes && <div className="summary-change__notes"><strong>Notes:</strong> {c.notes}</div>}
                {c.painNote && <div className="summary-change__notes"><strong>Pain / tenderness:</strong> {c.painNote}</div>}
                <div className="small muted" style={{ marginTop: '0.35rem' }}>
                  Noticed again: {c.recurrence ? c.recurrence.replace('-', ' ') : 'not answered'} · Discussion:{' '}
                  {c.discussedStatus === 'discussed' ? 'discussed with a healthcare professional' : 'not discussed yet'}
                </div>
              </div>
            ))
          )}
        </Section>

        <Section title="My usual baseline (user-entered)">
          {!summary.baselineSnapshot?.length ? (
            <NotProvided />
          ) : (
            <dl className="summary-facts">
              {summary.baselineSnapshot.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Section>

        <Section title="Record overview">
          <p>{summary.timelineNote}</p>
        </Section>

        <Section title="Questions">
          {summary.questions.length === 0 ? (
            <NotProvided />
          ) : (
            <ol className="summary-questions">
              {summary.questions.map((q) => (
                <li key={q.id}>
                  <span>
                    {q.text}
                    {q.priority === 'important' && <Badge tone="warm"> priority</Badge>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Relevant history">
          <TextOrNone value={summary.relevantHistory} />
        </Section>

        <Section title="Medications / supplements">
          <TextOrNone value={summary.medicationsSupplements} />
        </Section>

        <Section title="Screening history (from my records)">
          {summary.screeningFromRecords.length === 0 ? (
            <NotProvided />
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {summary.screeningFromRecords.map((r, i) => (
                <li key={i} style={{ marginBottom: '0.3rem' }}>
                  {formatDay(r.date)} — {r.type}
                  {r.facility ? ` · ${r.facility}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Screening notes">
          <TextOrNone value={summary.screeningNotes} />
        </Section>

        <Section title="Appointment">
          <TextOrNone value={summary.appointmentNote} />
        </Section>

        <Section title="Supporting documents available">
          {!summary.supportingDocuments?.length ? (
            <NotProvided />
          ) : (
            <ul className="summary-documents">
              {summary.supportingDocuments.map((document, index) => (
                <li key={`${document.name}-${index}`}>
                  <strong>{document.name}</strong>
                  {document.note ? ` — ${document.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="What I want to remember">
          <TextOrNone value={summary.additionalNotes} />
        </Section>

        <Section title="Notes during consultation">
          <div className="summary-note-lines" aria-label="Blank lines for handwritten consultation notes" />
        </Section>

        <p className="summary-disclaimer">
          This summary was created from information entered by the user. It is intended to support a conversation with
          a healthcare professional and is not a medical record or diagnosis.
        </p>
      </article>

      <div className="btn-row mt-6 no-print">
        <Button onClick={() => window.print()}>
          <IconPrint style={{ width: 16, height: 16 }} /> Print / Save as PDF
        </Button>
        <Button variant="secondary" onClick={startAnother}>
          <IconPlus style={{ width: 16, height: 16 }} /> Start another visit preparation
        </Button>
        <LinkButton to="/home" variant="ghost">
          Home
        </LinkButton>
      </div>
    </>
  );
}
