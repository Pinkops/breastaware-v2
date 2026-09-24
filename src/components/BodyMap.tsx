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
  // Diagram faces the viewer: viewer-right = person's LEFT.
  'upper-outer': { x: 66, y: 30 }, // person's outer = toward armpit
  'upper-inner': { x: 38, y: 30 },
  'lower-outer': { x: 66, y: 52 },
  'lower-inner': { x: 38, y: 52 },
  central: { x: 52, y: 41 },
  other: { x: 52, y: 41 },
};

function regionForPosition(xPct: number, yPct: number): BodyRegion {
  const personLeft = xPct > 50; // viewer-right side = person's left
  const outer = personLeft ? xPct > 58 : xPct < 42;
  const dx = Math.abs(xPct - 52);
  const dy = yPct - 41;
  if (dx < 7 && Math.abs(dy) < 8) return 'central';
  if (dy < -4) return outer ? 'upper-outer' : 'upper-inner';
  if (dy > 6) return outer ? 'lower-outer' : 'lower-inner';
  return outer ? 'upper-outer' : 'lower-inner';
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
    emit({ xPct: Math.round(xPct), yPct: Math.round(yPct), region, side: loc.side === 'unsure' ? inferSide(xPct) : loc.side });
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

  return (
    <div className="bodymap">
      <p className="bodymap__disclaimer">
        <IconInfo />
        <span>For personal documentation only. This map does not analyze, diagnose, or interpret findings.</span>
      </p>

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
          <legend className="label">Approximate area</legend>
          <p className="hint">Choose an area without using the diagram, or tap the diagram directly.</p>
          <div style={{ display: 'grid', gap: 6 }}>
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
                    emit({ region: r.id, xPct: pos.x, yPct: pos.y });
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
            : 'Body map. Use pointer to tap a location, or arrow keys to move the marker. Region and side selectors above work without this diagram.'
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

          {/* breast regions — left (viewer right) */}
          <g opacity="0.9">
            <circle cx="204" cy="132" r="34" fill="rgba(255,255,255,0.45)" stroke="#b9ac97" strokeWidth="1.6" />
            <circle cx="96" cy="132" r="34" fill="rgba(255,255,255,0.45)" stroke="#b9ac97" strokeWidth="1.6" />
            {/* quadrant guides */}
            <path d="M204 98 L204 166 M170 132 L238 132" stroke="#c4b7a2" strokeWidth="1" strokeDasharray="3 5" />
            <path d="M96 98 L96 166 M62 132 L130 132" stroke="#c4b7a2" strokeWidth="1" strokeDasharray="3 5" />
            {/* nipple markers */}
            <circle cx="204" cy="132" r="4" fill="#b9a98f" />
            <circle cx="96" cy="132" r="4" fill="#b9a98f" />
          </g>

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
