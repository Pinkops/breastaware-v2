import { useCallback, useId, useRef, useState } from 'react';
import type { ObservationLocation, Side, BodyRegion } from '../lib/types';
import { REGION_OPTIONS, SIDE_OPTIONS } from '../lib/types';
import { clamp } from '../lib/util';
import { IconInfo } from './icons';

/**
 * Body Map — a documentation tool, never an analysis tool (§11).
 *
 * - Pointer/touch: tap the diagram to place an approximate marker.
 * - Keyboard: focus the diagram, arrow keys nudge the marker (Home = centre).
 * - Non-visual alternative: side + region selectors are always available and
 *   drive the same marker. Nobody is forced to use the graphical map (§22).
 */

const REGION_POS: Record<BodyRegion, { x: number; y: number }> = {
  // Front-facing diagram: viewer-right is the person's left.
  'upper-outer': { x: 76, y: 30 },
  'upper-inner': { x: 59, y: 30 },
  'lower-outer': { x: 76, y: 45 },
  'lower-inner': { x: 59, y: 45 },
  central: { x: 68, y: 37 },
  'nipple-areola': { x: 68, y: 37 },
  axilla: { x: 89, y: 25 },
  collarbone: { x: 72, y: 18 },
  'chest-wall': { x: 50, y: 37 },
  other: { x: 68, y: 37 },
};

/** Translate a tap into a documentation region; this is geometry, not clinical interpretation. */
export function regionForPosition(xPct: number, yPct: number): BodyRegion {
  const breastCenterX = xPct > 50 ? 68 : 32;
  const dx = xPct - breastCenterX;
  const dy = yPct - 37;
  const distance = Math.hypot(dx, dy);

  if (yPct < 21 && (xPct < 44 || xPct > 56)) return 'collarbone';
  if (xPct >= 45 && xPct <= 55) return 'chest-wall';
  if ((xPct < 16 || xPct > 84) && yPct >= 21 && yPct <= 42) return 'axilla';
  if (distance <= 3.5) return 'nipple-areola';
  if (distance <= 8) return 'central';

  const outer = xPct > 50 ? dx > 0 : dx < 0;
  const upper = dy < 0;
  if (upper) return outer ? 'upper-outer' : 'upper-inner';
  return outer ? 'lower-outer' : 'lower-inner';
}

function defaultPosFor(side: Side, region: BodyRegion | null): { x: number; y: number } {
  const r = REGION_POS[region ?? 'other'];
  if (side === 'right') {
    // Mirror across the sternum for the person's right side.
    return { x: 100 - r.x, y: r.y };
  }
  if (side === 'both' || side === 'unsure') return { x: 52, y: 41 };
  return { x: r.x, y: r.y };
}

export function BodyMap({
  value,
  onChange,
  readOnly = false,
  idPrefix,
}: {
  value: ObservationLocation | null;
  onChange: (loc: ObservationLocation) => void;
  readOnly?: boolean;
  idPrefix: string;
}) {
  const liveId = useId();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [announced, setAnnounced] = useState('');

  const loc: ObservationLocation = value ?? {
    side: 'unsure',
    region: null,
    xPct: 52,
    yPct: 41,
    note: '',
  };

  const emit = useCallback(
    (next: Partial<ObservationLocation>) => {
      const merged = { ...loc, ...next };
      onChange(merged);
    },
    [loc, onChange],
  );

  const placeFromEvent = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 4, 96);
    const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 6, 92);
    const region = regionForPosition(xPct, yPct);
    const breastRegion = ['upper-outer', 'upper-inner', 'lower-outer', 'lower-inner', 'central', 'nipple-areola'].includes(region);
    emit({
      xPct: Math.round(xPct),
      yPct: Math.round(yPct),
      region,
      side: inferSide(xPct),
      ...(breastRegion ? {} : { clockPosition: null, distanceFromNippleCm: null }),
    });
    setAnnounced(`Marker placed, ${REGION_OPTIONS.find((r) => r.id === region)?.label}`);
  };

  const inferSide = (xPct: number): Side => (xPct > 50 ? 'left' : 'right');

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    const step = e.shiftKey ? 5 : 2;
    let { xPct, yPct } = loc;
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':
        xPct = clamp(xPct - step, 4, 96);
        break;
      case 'ArrowRight':
        xPct = clamp(xPct + step, 4, 96);
        break;
      case 'ArrowUp':
        yPct = clamp(yPct - step, 6, 92);
        break;
      case 'ArrowDown':
        yPct = clamp(yPct + step, 6, 92);
        break;
      case 'Home':
        xPct = 52;
        yPct = 41;
        break;
      case 'Enter':
      case ' ':
        emit({ region: regionForPosition(xPct, yPct) });
        setAnnounced(`Region set to ${REGION_OPTIONS.find((r) => r.id === regionForPosition(xPct, yPct))?.label}`);
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      if (e.key.startsWith('Arrow') || e.key === 'Home') {
        const region = regionForPosition(xPct, yPct);
        emit({ xPct: Math.round(xPct), yPct: Math.round(yPct), region });
        setAnnounced(
          `Marker at ${Math.round(xPct)} across, ${Math.round(yPct)} down. ${REGION_OPTIONS.find((r) => r.id === region)?.label}`,
        );
      }
    }
  };

  const showMarker = value !== null;
  const supportsBreastCoordinates = Boolean(
    loc.region && ['upper-outer', 'upper-inner', 'lower-outer', 'lower-inner', 'central', 'nipple-areola'].includes(loc.region),
  );

  return (
    <div className="bodymap">
      <p className="bodymap__disclaimer">
        <IconInfo />
        <span>For personal documentation only. This map does not analyze, diagnose, or interpret findings.</span>
      </p>

      {/* Graphical map (optional convenience) */}
      <div
        ref={canvasRef}
        className="bodymap__canvas"
        style={{ marginTop: '1.25rem' }}
        tabIndex={readOnly ? -1 : 0}
        role="application"
        aria-label={
          readOnly
            ? 'Body map showing the recorded marker'
            : 'Front-view breast location map. Tap an approximate location or use arrow keys to move the marker. Side and anatomical area selectors below provide an equivalent alternative.'
        }
        aria-describedby={liveId}
        onKeyDown={onKeyDown}
      >
        <svg
          viewBox="0 0 300 360"
          onClick={placeFromEvent as unknown as (e: React.MouseEvent<SVGElement>) => void}
          aria-hidden="true"
        >
          {/* Torso schematic — abstract, clinical, non-graphic */}
          <defs>
            <linearGradient id={`${idPrefix}-skin`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9e2d6" />
              <stop offset="1" stopColor="#ded5c6" />
            </linearGradient>
          </defs>

          {/* neck + shoulders */}
          <path
            d="M126 28 C126 46 122 52 110 58 C86 66 58 76 44 96 C34 110 30 130 32 152 L38 210 C40 232 46 250 54 268 L60 340 L240 340 L246 268 C254 250 260 232 262 210 L268 152 C270 130 266 110 256 96 C242 76 214 66 190 58 C178 52 174 46 174 28 Z"
            fill={`url(#${idPrefix}-skin)`}
            stroke="#b9ac97"
            strokeWidth="2"
          />
          {/* collarbones */}
          <path d="M96 92 C114 100 134 104 150 104 C166 104 186 100 204 92" stroke="#c4b7a2" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* sternum */}
          <path d="M150 108 L150 232" stroke="#c9bda9" strokeWidth="1.5" strokeDasharray="4 6" fill="none" />

          {/* Breast footprint and axillary tails. Boundaries are deliberately approximate. */}
          <g opacity="0.96">
            <path d="M225 108 C238 94 249 89 258 94 C247 105 239 116 235 128" fill="rgba(255,255,255,0.38)" stroke="#b9ac97" strokeWidth="1.5" />
            <path d="M75 108 C62 94 51 89 42 94 C53 105 61 116 65 128" fill="rgba(255,255,255,0.38)" stroke="#b9ac97" strokeWidth="1.5" />
            <circle cx="204" cy="132" r="40" fill="rgba(255,255,255,0.5)" stroke="#aa9c85" strokeWidth="1.8" />
            <circle cx="96" cy="132" r="40" fill="rgba(255,255,255,0.5)" stroke="#aa9c85" strokeWidth="1.8" />
            {/* Clinical quadrant guides */}
            <path d="M204 92 L204 172 M164 132 L244 132" stroke="#b9ac97" strokeWidth="1" strokeDasharray="4 5" />
            <path d="M96 92 L96 172 M56 132 L136 132" stroke="#b9ac97" strokeWidth="1" strokeDasharray="4 5" />
            {/* Areola and nipple reference points */}
            <circle cx="204" cy="132" r="8" fill="none" stroke="#b9a98f" strokeWidth="1.2" />
            <circle cx="96" cy="132" r="8" fill="none" stroke="#b9a98f" strokeWidth="1.2" />
            <circle cx="204" cy="132" r="2.8" fill="#a99375" />
            <circle cx="96" cy="132" r="2.8" fill="#a99375" />
          </g>

          <text x="150" y="190" textAnchor="middle" fontSize="10" fontWeight="650" letterSpacing="1.2" fill="#6d7e83" fontFamily="system-ui">
            FRONT VIEW · APPROXIMATE MAP
          </text>

          {/* side labels: diagram faces viewer → viewer-right is person's LEFT */}
          <text x="254" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5c7078" fontFamily="system-ui">
            YOUR
          </text>
          <text x="254" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5c7078" fontFamily="system-ui">
            LEFT
          </text>
          <text x="46" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5c7078" fontFamily="system-ui">
            YOUR
          </text>
          <text x="46" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5c7078" fontFamily="system-ui">
            RIGHT
          </text>
        </svg>

        {showMarker && (
          <div
            className="bodymap__marker"
            style={{ left: `${loc.xPct}%`, top: `${(loc.yPct / 100) * 100}%` }}
            aria-hidden="true"
          >
            <div className="bodymap__marker-dot">
              <span className="bodymap__pulse" />
            </div>
          </div>
        )}
      </div>


      {/* Non-visual / accessible alternative — always present, drives the same marker */}
      <div className="bodymap__tools">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">Side</legend>
          <div className="choices choices--2">
            {SIDE_OPTIONS.map((s) => (
              <label className="choice" key={s.id} style={{ padding: '9px 12px', minHeight: 44 }}>
                <input
                  type="radio"
                  name={`${idPrefix}-side`}
                  value={s.id}
                  checked={loc.side === s.id}
                  disabled={readOnly}
                  onChange={() => {
                    const pos = defaultPosFor(s.id, loc.region);
                    emit({ side: s.id, xPct: pos.x, yPct: pos.y, region: loc.region ?? (s.id === 'both' || s.id === 'unsure' ? null : 'upper-outer') });
                    setAnnounced(`Side set to ${s.label}`);
                  }}
                />
                <span className="choice__body">
                  <span className="choice__label">{s.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">Anatomical area</legend>
          <p className="hint">Choose the closest area. Quadrants are named from your perspective, not the viewer&rsquo;s.</p>
          <div className="bodymap__regions">
            {REGION_OPTIONS.map((r) => (
              <label className="choice" key={r.id} style={{ padding: '9px 12px', minHeight: 44 }}>
                <input
                  type="radio"
                  name={`${idPrefix}-region`}
                  value={r.id}
                  checked={loc.region === r.id}
                  disabled={readOnly}
                  onChange={() => {
                    const pos = defaultPosFor(loc.side, r.id);
                    const breastRegion = ['upper-outer', 'upper-inner', 'lower-outer', 'lower-inner', 'central', 'nipple-areola'].includes(r.id);
                    emit({
                      region: r.id,
                      xPct: pos.x,
                      yPct: pos.y,
                      ...(breastRegion ? {} : { clockPosition: null, distanceFromNippleCm: null }),
                    });
                    setAnnounced(`Area set to ${r.label}`);
                  }}
                />
                <span className="choice__body">
                  <span className="choice__label">{r.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {!readOnly && (
        <div className="bodymap__clinical-details">
          <div className="bodymap__detail-head">
            <strong>Optional location details</strong>
            <span>Only add estimates you feel confident about.</span>
          </div>

          <div className="bodymap__detail-grid">
            <label className="field">
              <span className="label">Pattern</span>
              <select
                className="select"
                value={loc.distribution ?? ''}
                onChange={(event) => emit({ distribution: (event.target.value || null) as ObservationLocation['distribution'] })}
              >
                <option value="">Not specified</option>
                <option value="one-area">One specific area</option>
                <option value="multiple-areas">Several separate areas</option>
                <option value="diffuse">Spread across a wider area</option>
                <option value="unsure">Not sure</option>
              </select>
            </label>

            <label className="field">
              <span className="label">Clock-face position</span>
              <select
                className="select"
                value={loc.clockPosition ?? ''}
                disabled={!supportsBreastCoordinates}
                onChange={(event) => emit({ clockPosition: event.target.value ? Number(event.target.value) : null })}
              >
                <option value="">Not specified</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                  <option key={hour} value={hour}>{hour} o&rsquo;clock</option>
                ))}
              </select>
              {!supportsBreastCoordinates && <span className="hint">Available after choosing an area on the breast.</span>}
            </label>

            <label className="field">
              <span className="label">Approx. distance from nipple</span>
              <span className="input-with-unit">
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="30"
                  step="0.5"
                  value={loc.distanceFromNippleCm ?? ''}
                  disabled={!supportsBreastCoordinates}
                  onChange={(event) => emit({
                    distanceFromNippleCm: event.target.value === '' ? null : clamp(Number(event.target.value), 0, 30),
                  })}
                  aria-label="Approximate distance from nipple in centimetres"
                />
                <span>cm</span>
              </span>
            </label>
          </div>
          <p className="hint bodymap__clock-hint">
            Clock-face reference: 12 is toward the head and 6 is toward the feet. Distance is an estimate from the centre of the nipple.
          </p>
        </div>
      )}

      <p className="bodymap__caption">
        {showMarker
          ? `${
              SIDE_OPTIONS.find((s) => s.id === loc.side)?.label ?? 'Side'
            }${
              loc.region ? ` · ${REGION_OPTIONS.find((r) => r.id === loc.region)?.label ?? ''}` : ' · approximate marker'
            }`
          : 'No marker placed yet — optional. You can describe the location in words instead.'}
      </p>

      <div aria-live="polite" className="sr-only" id={liveId}>
        {announced}
      </div>
    </div>
  );
}
