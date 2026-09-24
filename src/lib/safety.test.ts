import { describe, expect, it } from 'vitest';
import { clamp, formatDay, friendlyError, uid } from './util';
import { OBSERVATION_CATEGORIES, SIDE_OPTIONS, REGION_OPTIONS } from './types';
import { ARTICLES } from '../content/education';

describe('utilities', () => {
  it('formats user-entered dates without timezone drift', () => {
    expect(formatDay('2026-09-21')).toBe('September 21, 2026');
    expect(formatDay('')).toBe('');
    expect(formatDay('not-a-date')).toBe('not-a-date');
  });

  it('clamps body-map coordinates', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('generates unique ids', () => {
    expect(uid()).not.toBe(uid());
  });

  it('maps internal errors to human-readable copy (§38)', () => {
    expect(friendlyError(new Error('wrong-passphrase'))).toContain('passcode');
    expect(friendlyError(new Error('PGRST116: relation missing'))).toBe('Something went wrong. Please try again.');
  });
});

describe('medical-safety copy guards', () => {
  it('observation categories are documentation-only labels', () => {
    const banned = /cancer|diagnos|malignan|benign|risk\s*score|probab/i;
    for (const c of OBSERVATION_CATEGORIES) {
      expect(banned.test(c.label)).toBe(false);
      expect(banned.test(c.hint)).toBe(false);
    }
    for (const s of SIDE_OPTIONS) expect(banned.test(s.label)).toBe(false);
    for (const r of REGION_OPTIONS) expect(banned.test(r.label)).toBe(false);
  });

  it('every education article has verified-shape sources and dates', () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(8);
    for (const a of ARTICLES) {
      expect(a.sources.length).toBeGreaterThan(0);
      for (const s of a.sources) {
        expect(s.url).toMatch(/^https:\/\//);
        expect(s.name.length).toBeGreaterThan(3);
        expect(s.geography.length).toBeGreaterThan(1);
      }
      expect(a.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // No fabricated diagnostic claims in article bodies
      const body = a.body.join(' ');
      expect(body).not.toMatch(/BreastAware can (detect|diagnose|tell if)/i);
      expect(body).not.toMatch(/\d+% (chance|risk) of cancer/i);
    }
  });

  it('articles distinguish education from advice', () => {
    const screening = ARTICLES.find((a) => a.slug === 'screening-basics');
    expect(screening).toBeTruthy();
    expect(screening!.body.join(' ')).toMatch(/varies|differs|differ/i);
  });
});
