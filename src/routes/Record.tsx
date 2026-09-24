import { useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../lib/app-context';
import {
  OBSERVATION_CATEGORIES,
  SIDE_OPTIONS,
  type Observation,
  type ObservationDraft,
  type ObservationLocation,
  type Recurrence,
  type Side,
  type ObservationCategory,
} from '../lib/types';
import { Banner, Button, Field, PageHead, RadioCards, SuccessPanel, TextArea, TextInput, LinkButton } from '../components/primitives';
import { BodyMap } from '../components/BodyMap';
import { IconCheck, IconPlus, IconQuestion, IconTimeline } from '../components/icons';
import { friendlyError, nowISO, todayISODate, uid } from '../lib/util';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_TITLES = [
  'What did you notice?',
  'Where did you notice it?',
  'Approximate location',
  'When did you first notice it?',
  'Have you noticed it again?',
  'What would you like to remember?',
  'Questions for your healthcare professional',
  'Save',
];

interface Draft extends ObservationDraft {
  questionText: string;
}

const INITIAL: Draft = {
  dateFirstNoticed: todayISODate(),
  category: null as unknown as ObservationCategory,
  side: null as unknown as Side,
  location: null,
  locationNote: '',
  notes: '',
  recurrence: null,
  painNote: '',
  questionText: '',
};

export function RecordPage() {
  const { update, mode } = useApp();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [saved, setSaved] = useState<Observation | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);

  const totalSteps = STEP_TITLES.length;

  const validationError = useMemo(() => {
    switch (step) {
      case 0:
        return draft.category ? '' : 'Choose what you noticed. These are documentation categories, not diagnoses.';
      case 1:
        return draft.side ? '' : 'Choose a side — “Unsure / other” is a valid choice.';
      case 3:
        return draft.dateFirstNoticed ? '' : 'Enter the date you first noticed it (an estimate is fine).';
      default:
        return '';
    }
  }, [step, draft]);

  function next() {
    if (validationError) return;
    setStep((s) => Math.min(totalSteps - 1, s + 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setStep((s) => Math.max(0, s - 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save(e?: FormEvent) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const obs: Observation = {
        id: uid(),
        dateFirstNoticed: draft.dateFirstNoticed,
        category: draft.category,
        side: draft.side,
        location: draft.location,
        locationNote: draft.locationNote,
        notes: draft.notes.trim(),
        recurrence: draft.recurrence,
        painNote: draft.painNote.trim(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        discussedStatus: 'not-discussed',
        questionIds: [],
      };

      let questionId: string | null = null;
      const qText = draft.questionText.trim();

      update((d) => {
        let questions = d.questions;
        if (qText) {
          questionId = uid();
          questions = [
            ...d.questions,
            {
              id: questionId,
              text: qText,
              priority: 'normal',
              status: 'open',
              includeInSummary: true,
              relatedObsIds: [obs.id],
              createdAt: nowISO(),
              updatedAt: nowISO(),
            },
          ];
          obs.questionIds = [questionId];
        }
        return { ...d, observations: [obs, ...d.observations], questions };
      });

      setSavedQuestionId(questionId);
      setSaved(obs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(friendlyError(err, "We couldn't save that change. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Success state (§10 Step 8) ---------- */
  if (saved) {
    return (
      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        <SuccessPanel
          title="Change recorded."
          actions={
            <>
              <LinkButton to="/timeline">
                <IconTimeline style={{ width: 16, height: 16 }} /> View Timeline
              </LinkButton>
              <LinkButton to="/questions" variant="secondary">
                <IconQuestion style={{ width: 16, height: 16 }} /> Add a Question
              </LinkButton>
              <LinkButton to="/prepare" variant="secondary">
                Prepare for a Visit
              </LinkButton>
            </>
          }
        >
          Your observation has been added to your timeline.
          {savedQuestionId && ' The question you added is saved with your questions.'}
        </SuccessPanel>

        <div className="btn-row btn-row--center mt-6">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(INITIAL);
              setSaved(null);
              setStep(0);
              setSavedQuestionId(null);
            }}
          >
            <IconPlus style={{ width: 16, height: 16 }} /> Record another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Record"
        title="Record a Change"
        lede="A short, calm record of what you noticed. No interpretations — just your observations, organized."
      />

      <div style={{ maxWidth: '40rem' }}>
        <div className="wizard-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <span key={i} className={`wizard-progress__pip${i < step ? ' wizard-progress__pip--done' : ''}${i === step ? ' wizard-progress__pip--current' : ''}`} />
          ))}
        </div>

        <form onSubmit={step === totalSteps - 1 ? save : undefined} noValidate>
          <div className="wizard-step-label">
            Step {step + 1} of {totalSteps} · {STEP_TITLES[step]}
          </div>

          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}
          {validationError && step !== 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner tone="warn">{validationError}</Banner>
            </div>
          )}

          {/* Step 1 — What */}
          {step === 0 && (
            <RadioCards<ObservationCategory>
              legend="What did you notice?"
              hint="These are documentation categories, not diagnostic categories. BreastAware does not interpret what a change is."
              name="category"
              value={draft.category}
              error={step === 0 && !draft.category && draft.category !== undefined ? validationError : undefined}
              options={OBSERVATION_CATEGORIES.map((c) => ({ id: c.id, label: c.label, hint: c.hint }))}
              onChange={(category) => setDraft((d) => ({ ...d, category }))}
            />
          )}

          {/* Step 2 — Side */}
          {step === 1 && (
            <RadioCards<Side>
              legend="Where did you notice it?"
              name="side"
              value={draft.side}
              options={SIDE_OPTIONS}
              onChange={(side) => setDraft((d) => ({ ...d, side }))}
            />
          )}

          {/* Step 3 — Body map */}
          {step === 2 && (
            <div className="field">
              <p className="label">Approximate location</p>
              <p className="hint">
                Optional. Place a rough marker on the body map, or use the side and area lists — either way works
                without the diagram. You can also describe it in words below.
              </p>
              <BodyMap
                idPrefix="record-map"
                value={draft.location}
                onChange={(loc: ObservationLocation) => setDraft((d) => ({ ...d, location: loc }))}
              />
              <div className="mt-4">
                <Field label="Words instead of a marker" htmlFor="loc-note" optional hint="e.g. 'outer edge, near armpit'">
                  <TextInput
                    id="loc-note"
                    value={draft.locationNote}
                    maxLength={200}
                    onChange={(e) => setDraft((d) => ({ ...d, locationNote: e.target.value }))}
                    placeholder="Describe the location in your own words"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 4 — Date */}
          {step === 3 && (
            <Field
              label="When did you first notice it?"
              htmlFor="first-noticed"
              hint="An approximate date is fine. This is your recollection, not a clinical finding."
              error={validationError || undefined}
            >
              <TextInput
                id="first-noticed"
                type="date"
                max={todayISODate()}
                value={draft.dateFirstNoticed}
                onChange={(e) => setDraft((d) => ({ ...d, dateFirstNoticed: e.target.value }))}
                required
              />
            </Field>
          )}

          {/* Step 5 — Recurrence */}
          {step === 4 && (
            <RadioCards<Recurrence>
              legend="Have you noticed it again?"
              hint="Since you first noticed it, has it shown up more than once?"
              name="recurrence"
              value={draft.recurrence}
              options={[
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
                { id: 'not-sure', label: 'Not sure' },
              ]}
              onChange={(recurrence) => setDraft((d) => ({ ...d, recurrence }))}
            />
          )}

          {/* Step 6 — Notes */}
          {step === 5 && (
            <>
              <Field
                label="What would you like to remember?"
                htmlFor="obs-notes"
                hint="How it felt, what you were doing, anything a future you (or your healthcare professional) would find useful."
                optional
              >
                <TextArea
                  id="obs-notes"
                  rows={5}
                  className="textarea textarea--tall"
                  value={draft.notes}
                  maxLength={4000}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="In your own words…"
                />
              </Field>
              <Field label="Pain or tenderness" htmlFor="pain-note" optional hint="Only if you want to record it.">
                <TextInput
                  id="pain-note"
                  value={draft.painNote}
                  maxLength={300}
                  onChange={(e) => setDraft((d) => ({ ...d, painNote: e.target.value }))}
                  placeholder="e.g. tender to touch, eased after my period"
                />
              </Field>
            </>
          )}

          {/* Step 7 — Question */}
          {step === 6 && (
            <Field
              label="Add a question for my healthcare professional"
              htmlFor="obs-question"
              hint="Optional. We will save it with your questions — this app never answers medical questions itself."
              optional
            >
              <TextArea
                id="obs-question"
                rows={3}
                value={draft.questionText}
                maxLength={500}
                onChange={(e) => setDraft((d) => ({ ...d, questionText: e.target.value }))}
                placeholder="e.g. Could this be related to my cycle, or should it be examined?"
              />
            </Field>
          )}

          {/* Step 8 — Review & save */}
          {step === 7 && (
            <div className="card card--pad-lg">
              <p className="card__title">Review before saving</p>
              <dl className="dl">
                <div className="dl__row">
                  <dt>What</dt>
                  <dd>{OBSERVATION_CATEGORIES.find((c) => c.id === draft.category)?.label ?? '—'}</dd>
                </div>
                <div className="dl__row">
                  <dt>Where</dt>
                  <dd>
                    {SIDE_OPTIONS.find((s) => s.id === draft.side)?.label ?? '—'}
                    {draft.location?.region
                      ? ` · ${draft.location.region.replace(/-/g, ' ')}`
                      : draft.locationNote
                        ? ` · ${draft.locationNote}`
                        : ''}
                  </dd>
                </div>
                <div className="dl__row">
                  <dt>First noticed</dt>
                  <dd>{draft.dateFirstNoticed || '—'}</dd>
                </div>
                <div className="dl__row">
                  <dt>Noticed again</dt>
                  <dd>{draft.recurrence ? draft.recurrence.replace('-', ' ') : 'Not answered'}</dd>
                </div>
                <div className="dl__row">
                  <dt>Notes</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{draft.notes.trim() || 'Not provided'}</dd>
                </div>
                {draft.painNote.trim() && (
                  <div className="dl__row">
                    <dt>Pain / tenderness</dt>
                    <dd>{draft.painNote}</dd>
                  </div>
                )}
                <div className="dl__row">
                  <dt>Question</dt>
                  <dd>{draft.questionText.trim() || 'None added'}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <Banner tone="info">
                  Saving adds an entry to your personal timeline. This is not a diagnosis or medical assessment.
                </Banner>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="wizard-nav">
            {step > 0 ? (
              <Button variant="ghost" onClick={back}>
                Back
              </Button>
            ) : (
              <LinkButton to="/home" variant="ghost">
                Cancel
              </LinkButton>
            )}
            <span className="spacer" />
            {step < totalSteps - 1 ? (
              <Button onClick={next} disabled={Boolean(validationError)}>
                Continue
              </Button>
            ) : (
              <Button type="submit" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save to My Timeline'}
              </Button>
            )}
          </div>

          {step === 0 && (
            <p className="small muted center mt-6" style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
              <IconCheck style={{ width: 14, height: 14 }} /> Usually takes under a minute. Nothing is uploaded anywhere.
              {mode === 'demo' && ' (Demo session: entries stay in this tab.)'}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
