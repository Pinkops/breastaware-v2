/** BreastAware V2 — domain types.
 * Medical-safety rule: no diagnosis, probability, severity-score,
 * or clinical-interpretation fields exist anywhere in this model. */

export type Side = 'left' | 'right' | 'both' | 'unsure';

export type ObservationCategory =
  | 'lump'
  | 'skin'
  | 'nipple'
  | 'discharge'
  | 'pain'
  | 'size-shape'
  | 'other';

export type BodyRegion =
  | 'upper-outer'
  | 'upper-inner'
  | 'lower-outer'
  | 'lower-inner'
  | 'central'
  | 'nipple-areola'
  | 'axilla'
  | 'chest-wall'
  | 'other';

/** Approximate marker attached to an observation (never an isolated record). */
export interface ObservationLocation {
  side: Side;
  region: BodyRegion | null;
  /** Percentage coordinates within the body-map diagram (0–100). */
  xPct: number;
  yPct: number;
  note?: string;
}

export type Recurrence = 'yes' | 'no' | 'not-sure';
export type DiscussedStatus = 'not-discussed' | 'discussed';

export interface Observation {
  id: string;
  dateFirstNoticed: string; // YYYY-MM-DD (user-entered)
  category: ObservationCategory;
  side: Side;
  location: ObservationLocation | null;
  locationNote: string;
  notes: string;
  recurrence: Recurrence | null;
  painNote: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  discussedStatus: DiscussedStatus;
  questionIds: string[];
}

export type QuestionStatus = 'open' | 'discussed' | 'answered';

export interface Question {
  id: string;
  text: string;
  priority: 'normal' | 'important';
  status: QuestionStatus;
  includeInSummary: boolean;
  relatedObsIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  title: string;
  /** ISO datetime-local value entered by the user (no timezone inference). */
  datetime: string;
  provider: string;
  location: string;
  notes: string;
  reminderNote: string;
  createdAt: string;
}

export interface ScreeningRecord {
  id: string;
  type: string;
  date: string; // YYYY-MM-DD
  facility: string;
  notes: string;
  createdAt: string;
}

export interface PersonalBaseline {
  id: string;
  usualLook: string;
  usualFeel: string;
  sizeShape: string;
  texture: string;
  nipples: string;
  cycleChanges: string;
  asymmetry: string;
  otherNotes: string;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
}

export interface VisitPreparation {
  id: string;
  reason: string;
  observationIds: string[];
  questionIds: string[];
  historyNotes: string;
  medicationNotes: string;
  screeningNotes: string;
  appointmentId: string | null;
  rememberNotes: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/** Immutable snapshot built strictly from user-entered data (§42 — never invents). */
export interface VisitSummary {
  id: string;
  preparedBy: string;
  createdAt: string;
  reasonForVisit: string;
  changesToDiscuss: Array<{
    id: string;
    date: string;
    category: ObservationCategory;
    side: Side;
    locationText: string;
    notes: string;
    recurrence: Recurrence | null;
    discussedStatus: DiscussedStatus;
  }>;
  timelineNote: string;
  questions: Array<{ id: string; text: string; priority: Question['priority'] }>;
  relevantHistory: string;
  medicationsSupplements: string;
  screeningFromRecords: Array<{ date: string; type: string; facility: string }>;
  screeningNotes: string;
  appointmentNote: string;
  additionalNotes: string;
  sourcePrepId: string;
}

export interface VaultDocumentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  note: string;
}

export interface UserSettings {
  autoLockMinutes: 1 | 5 | 10 | 15 | 30;
  showAppointmentHints: boolean;
  onboardingDone: boolean;
}

export interface Profile {
  displayName: string;
  createdAt: string;
}

export interface Entitlement {
  provider: 'local-copy';
  plan: string;
  active: boolean;
  activatedAt: string;
}

export interface AppData {
  schemaVersion: 2;
  profile: Profile;
  settings: UserSettings;
  entitlement: Entitlement;
  baseline: PersonalBaseline | null;
  observations: Observation[];
  questions: Question[];
  appointments: Appointment[];
  screenings: ScreeningRecord[];
  preparations: VisitPreparation[];
  summaries: VisitSummary[];
  documents: VaultDocumentMeta[]; // file bytes live encrypted in IndexedDB
}

export type ObservationDraft = Omit<
  Observation,
  'id' | 'createdAt' | 'updatedAt' | 'discussedStatus' | 'questionIds'
>;

export const OBSERVATION_CATEGORIES: Array<{
  id: ObservationCategory;
  label: string;
  hint: string;
}> = [
  { id: 'lump', label: 'Lump or thickening', hint: 'A lump, firm area, or thickening you noticed.' },
  { id: 'skin', label: 'Skin change', hint: 'Dimpling, redness, rash, puckering, or other skin change.' },
  { id: 'nipple', label: 'Nipple change', hint: 'Shape change, pulling in, scaling, or other nipple change.' },
  { id: 'discharge', label: 'Discharge', hint: 'Fluid from the nipple that is not breast milk.' },
  { id: 'pain', label: 'Pain or tenderness', hint: 'Pain, heaviness, or tenderness in one or both breasts.' },
  { id: 'size-shape', label: 'Change in size or shape', hint: 'A change in size, shape, or contour.' },
  { id: 'other', label: 'Other', hint: 'Anything else you want to remember.' },
];

export const SIDE_OPTIONS: Array<{ id: Side; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'both', label: 'Both' },
  { id: 'unsure', label: 'Unsure / other' },
];

export const REGION_OPTIONS: Array<{ id: BodyRegion; label: string }> = [
  { id: 'upper-outer', label: 'Upper outer quadrant (toward the armpit)' },
  { id: 'upper-inner', label: 'Upper inner quadrant (toward the breastbone)' },
  { id: 'lower-outer', label: 'Lower outer quadrant' },
  { id: 'lower-inner', label: 'Lower inner quadrant' },
  { id: 'central', label: 'Central / retroareolar area' },
  { id: 'nipple-areola', label: 'Nipple or areola' },
  { id: 'axilla', label: 'Axilla (armpit) or axillary tail' },
  { id: 'chest-wall', label: 'Chest wall or breastbone area' },
  { id: 'other', label: 'Another nearby area' },
];

export const SCREENING_TYPES = [
  'Mammogram',
  'Ultrasound',
  'MRI',
  'Clinical breast examination',
  'Other imaging',
  'Other',
];
