import type { AppData } from './types';
import { nowISO, uid, todayISODate } from './util';
import { buildVisitSummary } from './summary';

export function emptyData(displayName: string): AppData {
  const ts = nowISO();
  return {
    schemaVersion: 2,
    profile: { displayName, createdAt: ts },
    settings: { autoLockMinutes: 10, showAppointmentHints: true, onboardingDone: false },
    entitlement: { provider: 'local-copy', plan: 'BreastAware one-time copy', active: true, activatedAt: ts },
    baseline: null,
    observations: [],
    questions: [],
    appointments: [],
    screenings: [],
    preparations: [],
    summaries: [],
    documents: [],
  };
}

/** Explicit, labeled sample content for demo mode only (§51–52).
 * Lives in sessionStorage, shows a permanent "Demo data" banner,
 * and never touches a real profile. */
export function seedDemoData(): AppData {
  const base = emptyData('Sample Person');
  const day = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const obs1Id = uid();
  const obs2Id = uid();
  const q1Id = uid();
  const q2Id = uid();
  const apptId = uid();
  const prepId = uid();

  const baseline: AppData['baseline'] = {
    id: uid(),
    usualLook:
      'My left breast has always been slightly larger than my right. Skin tone is even, no dimpling that I am aware of.',
    usualFeel:
      'Generally soft with some lumpiness near the upper outer area, a little more pronounced before my period.',
    sizeShape: 'Teardrop shape, modest size, stable for the last few years.',
    texture: 'Slightly granular in the outer half; smoother toward the centre.',
    nipples: 'Both nipples point slightly outward; no discharge at baseline.',
    cycleChanges: 'Tenderness and lumpiness in the week before my period, easing once it starts.',
    asymmetry: 'Long-standing: left slightly larger and a little lower than right.',
    otherNotes: 'I usually notice things most easily when lying down in the evening.',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    lastReviewedAt: day(14),
  };

  const observations: AppData['observations'] = [
    {
      id: obs1Id,
      dateFirstNoticed: day(9),
      category: 'pain',
      side: 'right',
      location: { side: 'right', region: 'upper-outer', xPct: 24, yPct: 29, note: '' },
      locationNote: '',
      notes: 'Tender spot that came on a few days before my period. Felt similar to pre-period tenderness but a bit more localised.',
      recurrence: 'yes',
      painNote: 'Tender to touch; eased after my period started.',
      createdAt: `${day(9)}T20:14:00.000Z`,
      updatedAt: `${day(9)}T20:14:00.000Z`,
      discussedStatus: 'not-discussed',
      questionIds: [q1Id],
    },
    {
      id: obs2Id,
      dateFirstNoticed: day(21),
      category: 'size-shape',
      side: 'left',
      location: null,
      locationNote: '',
      notes: 'Felt like the usual pre-period fullness. No specific spot; general compare-with-baseline note.',
      recurrence: 'not-sure',
      painNote: '',
      createdAt: `${day(21)}T08:02:00.000Z`,
      updatedAt: `${day(21)}T08:02:00.000Z`,
      discussedStatus: 'discussed',
      questionIds: [],
    },
  ];

  const questions: AppData['questions'] = [
    {
      id: q1Id,
      text: 'Could this tenderness be related to my cycle, or should it be examined?',
      priority: 'important',
      status: 'open',
      includeInSummary: true,
      relatedObsIds: [obs1Id],
      createdAt: `${day(8)}T09:30:00.000Z`,
      updatedAt: `${day(8)}T09:30:00.000Z`,
    },
    {
      id: q2Id,
      text: 'Is it time to schedule my next screening, and which type is right for me?',
      priority: 'normal',
      status: 'open',
      includeInSummary: true,
      relatedObsIds: [],
      createdAt: `${day(4)}T18:45:00.000Z`,
      updatedAt: `${day(4)}T18:45:00.000Z`,
    },
  ];

  const future = new Date();
  future.setDate(future.getDate() + 12);
  const apptDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
    future.getDate(),
  ).padStart(2, '0')}`;

  const appointments: AppData['appointments'] = [
    {
      id: apptId,
      title: 'Routine appointment',
      datetime: `${apptDate}T10:30`,
      provider: 'Dr. Sample (demo entry)',
      location: 'Community clinic',
      notes: 'Bring the visit summary and my timeline printout.',
      reminderNote: '',
      createdAt: nowISO(),
    },
  ];

  const screenings: AppData['screenings'] = [
    {
      id: uid(),
      type: 'Mammogram',
      date: day(240),
      facility: 'Regional screening centre (demo entry)',
      notes: 'Routine screening; letter received with result.',
      createdAt: nowISO(),
    },
  ];

  const preparations: AppData['preparations'] = [
    {
      id: prepId,
      reason: 'Follow-up about cycle-related tenderness and questions about screening timing.',
      observationIds: [obs1Id],
      questionIds: [q1Id, q2Id],
      historyNotes: 'No prior breast procedures. Family history: mother had a benign biopsy years ago.',
      medicationNotes: 'Multivitamin daily. No hormonal medication.',
      screeningNotes: 'Last recorded screening is listed from my records.',
      appointmentId: apptId,
      rememberNotes: 'Ask about when to return for my next screening.',
      status: 'in-progress',
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
  ];

  const dataWithRecords: AppData = {
    ...base,
    baseline,
    observations,
    questions,
    appointments,
    screenings,
    preparations,
    settings: { ...base.settings, onboardingDone: true },
  };
  // Demo includes one finished summary so the endpoint of the workflow is visible.
  const demoSummary = buildVisitSummary(dataWithRecords, preparations[0]);
  return { ...dataWithRecords, summaries: [demoSummary] };
}

export function migrate(raw: AppData): AppData {
  // Future schema migrations run here before first render. v2 is current.
  const data: AppData = { ...raw };
  if (!data.settings) {
    data.settings = { autoLockMinutes: 10, showAppointmentHints: true, onboardingDone: true };
  }
  data.baseline = data.baseline ?? null;
  data.observations = data.observations ?? [];
  data.questions = data.questions ?? [];
  data.appointments = data.appointments ?? [];
  data.screenings = data.screenings ?? [];
  data.preparations = data.preparations ?? [];
  data.summaries = data.summaries ?? [];
  data.documents = data.documents ?? [];
  return data;
}

/** Generate a fresh in-progress preparation wired to today's context. */
export function newPreparation(): AppData['preparations'][number] {
  return {
    id: uid(),
    reason: '',
    observationIds: [],
    questionIds: [],
    historyNotes: '',
    medicationNotes: '',
    screeningNotes: '',
    appointmentId: null,
    rememberNotes: '',
    status: 'in-progress',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

export { todayISODate };
