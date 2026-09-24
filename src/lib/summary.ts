import type { AppData, VisitSummary, VisitPreparation, Observation } from './types';
import { categoryLabel, locationText } from './selectors';
import { formatDay, nowISO, uid } from './util';

const NOT_PROVIDED = 'Not provided';

function text(value: string): string {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : NOT_PROVIDED;
}

/**
 * Build a visit summary strictly from user-entered records (§42).
 * Never invents symptoms, dates, medications, or conclusions.
 * Missing sections render as "Not provided".
 */
export function buildVisitSummary(data: AppData, prep: VisitPreparation): VisitSummary {
  const byId = new Map<string, Observation>(data.observations.map((o) => [o.id, o]));
  const changes = prep.observationIds
    .map((id) => byId.get(id))
    .filter((o): o is Observation => Boolean(o))
    .sort((a, b) => (a.dateFirstNoticed < b.dateFirstNoticed ? 1 : -1))
    .map((o) => ({
      id: o.id,
      date: o.dateFirstNoticed,
      category: o.category,
      side: o.side,
      locationText: locationText(o),
      notes: text(o.notes) === NOT_PROVIDED ? '' : o.notes.trim(),
      recurrence: o.recurrence,
      discussedStatus: o.discussedStatus,
    }));

  const qById = new Map(data.questions.map((q) => [q.id, q]));
  const questions = prep.questionIds
    .map((id) => qById.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q) && Boolean(q?.includeInSummary))
    .map((q) => ({ id: q.id, text: q.text.trim(), priority: q.priority }));

  const appointment = prep.appointmentId
    ? data.appointments.find((a) => a.id === prep.appointmentId)
    : undefined;

  const screeningFromRecords = [...data.screenings]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((s) => ({ date: s.date, type: s.type, facility: s.facility }));

  const timelineNote =
    data.observations.length > 0
      ? `${data.observations.length} observation${data.observations.length === 1 ? '' : 's'} recorded in total; ${changes.length} selected for this visit.`
      : 'No observations recorded yet.';

  return {
    id: uid(),
    preparedBy: text(data.profile.displayName),
    createdAt: nowISO(),
    reasonForVisit: text(prep.reason),
    changesToDiscuss: changes,
    timelineNote,
    questions,
    relevantHistory: text(prep.historyNotes),
    medicationsSupplements: text(prep.medicationNotes),
    screeningFromRecords,
    screeningNotes: text(prep.screeningNotes),
    appointmentNote: appointment
      ? `${appointment.title} — ${appointment.datetime.replace('T', ' at ')}${
          appointment.provider ? ` · ${appointment.provider}` : ''
        }`
      : NOT_PROVIDED,
    additionalNotes: text(prep.rememberNotes),
    sourcePrepId: prep.id,
  };
}

/** Plain-text rendering — used by print view and as an accessible fallback. */
export function summaryToText(s: VisitSummary): string {
  const lines: string[] = [];
  lines.push('BREAST HEALTH VISIT SUMMARY');
  lines.push('');
  lines.push(`Prepared by: ${s.preparedBy}`);
  lines.push(`Date: ${formatDay(s.createdAt.slice(0, 10))}`);
  lines.push('');
  lines.push(`REASON FOR VISIT\n${s.reasonForVisit}`);
  lines.push('');
  if (s.changesToDiscuss.length === 0) {
    lines.push(`CHANGES I WANT TO DISCUSS\n${NOT_PROVIDED}`);
  } else {
    lines.push('CHANGES I WANT TO DISCUSS');
    for (const c of s.changesToDiscuss) {
      lines.push(`• ${formatDay(c.date)} — ${categoryLabel(c.category)}, ${c.locationText}`);
      if (c.notes) lines.push(`  ${c.notes}`);
      if (c.recurrence) lines.push(`  Noticed again: ${c.recurrence.replace('-', ' ')}`);
      lines.push(`  Discussion: ${c.discussedStatus === 'discussed' ? 'Discussed with a healthcare professional' : 'Not discussed yet'}`);
    }
  }
  lines.push('');
  lines.push(`TIMELINE\n${s.timelineNote}`);
  lines.push('');
  if (s.questions.length === 0) {
    lines.push(`QUESTIONS\n${NOT_PROVIDED}`);
  } else {
    lines.push('QUESTIONS');
    s.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.text}${q.priority === 'important' ? ' (priority)' : ''}`));
  }
  lines.push('');
  lines.push(`RELEVANT HISTORY\n${s.relevantHistory}`);
  lines.push('');
  lines.push(`MEDICATIONS / SUPPLEMENTS\n${s.medicationsSupplements}`);
  lines.push('');
  lines.push('SCREENING HISTORY (FROM MY RECORDS)');
  if (s.screeningFromRecords.length === 0) lines.push(NOT_PROVIDED);
  else s.screeningFromRecords.forEach((r) => lines.push(`• ${formatDay(r.date)} — ${r.type}${r.facility ? ` · ${r.facility}` : ''}`));
  lines.push('');
  lines.push(`SCREENING NOTES\n${s.screeningNotes}`);
  lines.push('');
  lines.push(`APPOINTMENT\n${s.appointmentNote}`);
  lines.push('');
  lines.push(`WHAT I WANT TO REMEMBER\n${s.additionalNotes}`);
  lines.push('');
  lines.push(
    'This summary was created from information entered by the user. It is intended to support a conversation with a healthcare professional and is not a medical record or diagnosis.',
  );
  return lines.join('\n');
}
