import type { AppData, Observation, Question, Appointment, ScreeningRecord } from './types';
import { formatDay, formatDateTime } from './util';
import { OBSERVATION_CATEGORIES } from './types';

export type TimelineEventType = 'observation' | 'question' | 'appointment' | 'screening';
export type TimelineFilter = 'all' | TimelineEventType;

export interface TimelineEvent {
  key: string;
  type: TimelineEventType;
  /** Sort key (ISO). */
  sortDate: string;
  /** Display date (may be a plain user-entered date). */
  displayDate: string;
  title: string;
  subtitle: string;
  sourceId: string;
}

export function categoryLabel(id: string): string {
  return OBSERVATION_CATEGORIES.find((c) => c.id === id)?.label ?? 'Observation';
}

export function sideLabel(side: string): string {
  switch (side) {
    case 'left':
      return 'Left';
    case 'right':
      return 'Right';
    case 'both':
      return 'Both sides';
    default:
      return 'Unsure / other';
  }
}

export function locationText(obs: Observation): string {
  if (obs.location) {
    const region = obs.location.region
      ? (REGION_TEXT[obs.location.region] ?? 'Other area')
      : 'Approximate marker placed';
    return `${sideLabel(obs.location.side)} — ${region}`;
  }
  if (obs.locationNote.trim()) return `${sideLabel(obs.side)} — ${obs.locationNote.trim()}`;
  return sideLabel(obs.side);
}

const REGION_TEXT: Record<string, string> = {
  'upper-outer': 'upper outer area',
  'upper-inner': 'upper inner area',
  'lower-outer': 'lower outer area',
  'lower-inner': 'lower inner area',
  central: 'central / retroareolar area',
  'nipple-areola': 'nipple or areola',
  axilla: 'axilla (armpit) or axillary tail',
  'chest-wall': 'chest wall or breastbone area',
  other: 'another nearby area',
};

export function buildTimeline(data: AppData): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const o of data.observations) {
    events.push({
      key: `obs-${o.id}`,
      type: 'observation',
      sortDate: o.dateFirstNoticed || o.createdAt,
      displayDate: formatDay(o.dateFirstNoticed || o.createdAt.slice(0, 10)),
      title: 'Observation recorded',
      subtitle: `${categoryLabel(o.category)} · ${sideLabel(o.side)}`,
      sourceId: o.id,
    });
  }

  for (const q of data.questions) {
    events.push({
      key: `q-${q.id}`,
      type: 'question',
      sortDate: q.createdAt.slice(0, 10),
      displayDate: formatDay(q.createdAt.slice(0, 10)),
      title: 'Question added',
      subtitle: q.text.length > 72 ? `${q.text.slice(0, 72)}…` : q.text,
      sourceId: q.id,
    });
  }

  for (const a of data.appointments) {
    events.push({
      key: `appt-${a.id}`,
      type: 'appointment',
      sortDate: a.datetime.slice(0, 10) || a.createdAt.slice(0, 10),
      displayDate: formatDateTime(a.datetime) || formatDay(a.createdAt.slice(0, 10)),
      title: 'Appointment recorded',
      subtitle: a.title,
      sourceId: a.id,
    });
  }

  for (const s of data.screenings) {
    events.push({
      key: `scr-${s.id}`,
      type: 'screening',
      sortDate: s.date || s.createdAt.slice(0, 10),
      displayDate: formatDay(s.date || s.createdAt.slice(0, 10)),
      title: 'Screening recorded',
      subtitle: s.type,
      sourceId: s.id,
    });
  }

  return events.sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0));
}

export function filterTimeline(events: TimelineEvent[], filter: TimelineFilter): TimelineEvent[] {
  if (filter === 'all') return events;
  return events.filter((e) => e.type === filter);
}

export interface UpcomingAppointment {
  appointment: Appointment;
  days: number;
}

export function upcomingAppointment(data: AppData): UpcomingAppointment | null {
  const list = [...data.appointments]
    .filter((a) => a.datetime)
    .sort((a, b) => (a.datetime < b.datetime ? -1 : 1));
  const now = new Date();
  for (const a of list) {
    const when = new Date(a.datetime);
    if (!Number.isNaN(getTimeSafe(a))) {
      if (when.getTime() >= now.getTime() - 86_400_000) {
        const days = Math.ceil((when.getTime() - now.getTime()) / 86_400_000);
        return { appointment: a, days };
      }
    }
  }
  return null;
}

function getTimeSafe(a: Appointment): number {
  return new Date(a.datetime).getTime();
}

export type HomeStatusKind =
  | 'no-baseline'
  | 'baseline-no-obs'
  | 'upcoming-visit'
  | 'recent-activity'
  | 'ready';

export interface HomeStatus {
  kind: HomeStatusKind;
  message: string;
  actionLabel: string;
  actionTo: string;
}

export function homeStatus(data: AppData): HomeStatus {
  const up = upcomingAppointment(data);
  if (up && up.days <= 21) {
    return {
      kind: 'upcoming-visit',
      message: `Your visit is ${up.days <= 0 ? 'today' : `in ${up.days} day${up.days === 1 ? '' : 's'}`}. Continue preparing your summary.`,
      actionLabel: 'Prepare for a Visit',
      actionTo: '/prepare',
    };
  }
  if (!data.baseline) {
    return {
      kind: 'no-baseline',
      message: 'Start with My Normal — a short description of what is usual for you gives every later record a reference point.',
      actionLabel: 'Start My Normal',
      actionTo: '/my-normal',
    };
  }
  if (data.observations.length === 0) {
    return {
      kind: 'baseline-no-obs',
      message: 'Your baseline is ready. Record a change whenever you notice something you want to remember.',
      actionLabel: 'Record a Change',
      actionTo: '/record',
    };
  }
  return {
    kind: 'ready',
    message: 'Everything is organised. Review your timeline or keep preparing for your next conversation.',
    actionLabel: 'Review My Timeline',
    actionTo: '/timeline',
  };
}

export function openQuestionCount(questions: Question[]): number {
  return questions.filter((q) => q.status === 'open').length;
}

export function lastUpdatedLabel(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  return formatDay(iso.slice(0, 10));
}

export type { Observation, Question, Appointment, ScreeningRecord };
