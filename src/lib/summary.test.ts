import { describe, expect, it } from 'vitest';
import { buildVisitSummary, summaryToText } from './summary';
import { emptyData } from './store';
import type { AppData, Observation, Question, VisitPreparation } from './types';

function fixture(): { data: AppData; prep: VisitPreparation } {
  const data = emptyData('Alex');
  const obs: Observation = {
    id: 'obs-1',
    dateFirstNoticed: '2026-09-14',
    category: 'pain',
    side: 'right',
    location: { side: 'right', region: 'upper-outer', xPct: 66, yPct: 34, note: '' },
    locationNote: '',
    notes: 'Tender before period.',
    recurrence: 'yes',
    painNote: '',
    createdAt: '2026-09-14T10:00:00.000Z',
    updatedAt: '2026-09-14T10:00:00.000Z',
    discussedStatus: 'not-discussed',
    questionIds: ['q-1'],
  };
  const q1: Question = {
    id: 'q-1',
    text: 'Could this be cycle-related?',
    priority: 'important',
    status: 'open',
    includeInSummary: true,
    relatedObsIds: ['obs-1'],
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  };
  const q2: Question = { ...q1, id: 'q-2', text: 'Excluded question', includeInSummary: false };
  data.observations = [obs];
  data.questions = [q1, q2];
  const prep: VisitPreparation = {
    id: 'prep-1',
    reason: 'Follow-up about tenderness',
    observationIds: ['obs-1', 'missing-id'],
    questionIds: ['q-1', 'q-2', 'missing-q'],
    historyNotes: '',
    medicationNotes: '',
    screeningNotes: '',
    appointmentId: null,
    rememberNotes: '',
    status: 'in-progress',
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  };
  return { data, prep };
}

describe('buildVisitSummary (§42 — never invents)', () => {
  it('uses only user-entered fields and shows Not provided when empty', () => {
    const { data, prep } = fixture();
    const s = buildVisitSummary(data, prep);
    expect(s.reasonForVisit).toBe('Follow-up about tenderness');
    expect(s.relevantHistory).toBe('Not provided');
    expect(s.medicationsSupplements).toBe('Not provided');
    expect(s.screeningNotes).toBe('Not provided');
    expect(s.additionalNotes).toBe('Not provided');
    expect(s.appointmentNote).toBe('Not provided');
    expect(s.preparedBy).toBe('Alex');
  });

  it('includes only selected, existing observations and includeInSummary questions', () => {
    const { data, prep } = fixture();
    const s = buildVisitSummary(data, prep);
    expect(s.changesToDiscuss).toHaveLength(1);
    expect(s.changesToDiscuss[0].id).toBe('obs-1');
    expect(s.questions.map((q) => q.id)).toEqual(['q-1']); // excluded + missing filtered out
  });

  it('carries no diagnosis-like fields', () => {
    const { data, prep } = fixture();
    const s = buildVisitSummary(data, prep) as unknown as Record<string, unknown>;
    for (const banned of ['diagnosis', 'cancerProbability', 'riskScore', 'severity', 'verdict']) {
      expect(Object.keys(s)).not.toContain(banned);
    }
  });

  it('renders text with disclaimer and no hallucinated sections', () => {
    const { data, prep } = fixture();
    const text = summaryToText(buildVisitSummary(data, prep));
    expect(text).toContain('not a medical record or diagnosis');
    expect(text).toContain('RELEVANT HISTORY');
    expect(text).toContain('Not provided');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
  });
});
