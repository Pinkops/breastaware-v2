import { describe, expect, it } from 'vitest';
import { regionForPosition } from './BodyMap';

describe('body-map anatomical regions', () => {
  it('maps both breasts consistently from the user-facing front view', () => {
    expect(regionForPosition(76, 29)).toBe('upper-outer'); // person's left
    expect(regionForPosition(24, 29)).toBe('upper-outer'); // person's right
    expect(regionForPosition(59, 45)).toBe('lower-inner');
    expect(regionForPosition(41, 45)).toBe('lower-inner');
  });

  it('distinguishes nipple/areola, central, axillary, and chest-wall areas', () => {
    expect(regionForPosition(68, 37)).toBe('nipple-areola');
    expect(regionForPosition(73, 40)).toBe('central');
    expect(regionForPosition(90, 25)).toBe('axilla');
    expect(regionForPosition(50, 37)).toBe('chest-wall');
  });
});
