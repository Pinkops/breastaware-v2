import { describe, expect, it } from 'vitest';
import { buildTimeline, filterTimeline, homeStatus, upcomingAppointment } from './selectors';
import { emptyData } from './store';
import type { Appointment, Observation, ScreeningRecord } from './types';

function obs(id: string, date: string): Observation {
  return {
    id,
    dateFirstNoticed: date,
    category: 'other',
    side: 'unsure',
    location: null,
    locationNote: '',
    notes: 'n',
    recurrence: null,
    painNote: '',
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    discussedStatus: 'not-discussed',
    questionIds: [],
  };
}

describe('timeline', () => {
  it('combines and sorts record types newest-first', () => {
    const data = emptyData('T');
    data.observations = [obs('a', '2026-09-01'), obs('b', '2026-09-21')];
    data.questions = [
      {
        id: 'q',
        text: 'Question?',
        priority: 'normal',
        status: 'open',
        includeInSummary: true,
        relatedObsIds: [],
        createdAt: '2026-09-18T10:00:00.000Z',
        updatedAt: '2026-09-18T10:00:00.000Z',
      },
    ];
    const screening: ScreeningRecord = {
      id: 's',
      type: 'Mammogram',
      date: '2026-09-10',
      facility: '',
      notes: '',
      createdAt: '2026-09-10T10:00:00.000Z',
    };
    data.screenings = [screening];

    const events = buildTimeline(data);
    expect(events.map((e) => e.type)).toEqual(['observation', 'question', 'screening', 'observation']);
    expect(events[0].sourceId).toBe('b');

    expect(filterTimeline(events, 'observation')).toHaveLength(2);
    expect(filterTimeline(events, 'question')).toHaveLength(1);
    expect(filterTimeline(events, 'screening')).toHaveLength(1);
    expect(filterTimeline(events, 'appointment')).toHaveLength(0);
    expect(filterTimeline(events, 'all')).toHaveLength(events.length);
  });

  it('never puts health text into event source hrefs (ids only)', () => {
    const data = emptyData('T');
    data.observations = [obs('uuid-only', '2026-09-01')];
    const [e] = buildTimeline(data);
    expect(e.sourceId).toBe('uuid-only');
  });
});

describe('home status & appointments', () => {
  it('asks for a baseline first when none exists', () => {
    const data = emptyData('T');
    expect(homeStatus(data).kind).toBe('no-baseline');
    data.baseline = {
      id: 'b',
      usualLook: '',
      usualFeel: '',
      sizeShape: '',
      texture: '',
      nipples: '',
      cycleChanges: '',
      asymmetry: '',
      otherNotes: '',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
      lastReviewedAt: null,
    };
    expect(homeStatus(data).kind).toBe('baseline-no-obs');
  });

  it('surfaces an upcoming appointment within 21 days', () => {
    const data = emptyData('T');
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const iso = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}T10:00`;
    const appt: Appointment = {
      id: 'ap',
      title: 'Visit',
      datetime: iso,
      provider: '',
      location: '',
      notes: '',
      reminderNote: '',
      createdAt: new Date().toISOString(),
    };
    data.appointments = [appt];
    const up = upcomingAppointment(data);
    expect(up).not.toBeNull();
    expect(homeStatus(data).kind).toBe('upcoming-visit');
  });
});
