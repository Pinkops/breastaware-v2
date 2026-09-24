/** Inline SVG icon set — stroke-based, consistent 24px grid, no icon fonts or CDNs. */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P): P => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...props,
});

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const IconTimeline = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4v16" />
    <circle cx="7" cy="8" r="2" />
    <circle cx="7" cy="16" r="2" />
    <path d="M12 8h8" />
    <path d="M12 16h6" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const IconPrep = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M9 10h6" />
    <path d="M9 14h6" />
    <path d="M9 18h3" />
  </svg>
);

export const IconMore = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.5v5.7c0 4.4 2.9 7.5 7 9.3 4.1-1.8 7-4.9 7-9.3V5.5L12 3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const IconDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16" />
    <path d="M8.5 3.5v4" />
    <path d="M15.5 3.5v4" />
  </svg>
);

export const IconScreening = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="13" rx="2" />
    <path d="M7 9.5h4" />
    <path d="M7 13.5h7" />
    <path d="M16.5 16.5l3.5 3.5" />
    <circle cx="15.5" cy="15.5" r="2.8" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 6.5C10.5 5 8.5 4.5 4.5 4.8v13.5c4-.3 6 .2 7.5 1.7 1.5-1.5 3.5-2 7.5-1.7V4.8c-4-.3-6 .2-7.5 1.7Z" />
    <path d="M12 6.5V20" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.4-6.5-10.3A6.5 6.5 0 0 1 12 4.2a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);

export const IconQuestion = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.7 9.6a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .9-1 1.6v.3" />
    <circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6.5h12" />
    <path d="M8 12h12" />
    <path d="M8 17.5h12" />
    <circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5.5 18.5 9.5 9 19H5v-4l9.5-9.5Z" />
    <path d="m13 7 4 4" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 7h14" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M7 7v12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5V7" />
    <path d="M10.5 11v5.5" />
    <path d="M13.5 11v5.5" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11" />
    <path d="m7.5 11 4.5 4.5L16.5 11" />
    <path d="M5 19.5h14" />
  </svg>
);

export const IconPrint = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V4.5h10V8" />
    <rect x="4" y="8" width="16" height="8.5" rx="1.5" />
    <path d="M7 14.5h10V20H7v-5.5Z" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5.5 20c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v4" />
    <path d="M12 16v4" />
    <path d="M4 12h4" />
    <path d="M16 12h4" />
    <path d="m6.5 6.5 2.5 2.5" />
    <path d="m15 15 2.5 2.5" />
    <path d="m17.5 6.5-2.5 2.5" />
    <path d="m9 15-2.5 2.5" />
  </svg>
);

export const IconNote = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 4.5h12v15H6z" />
    <path d="M9 9h6" />
    <path d="M9 12.5h6" />
    <path d="M9 16h3.5" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12h14" />
    <path d="m13.5 7 5 5-5 5" />
  </svg>
);

export const IconPower = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v7" />
    <path d="M7.5 7.2a7 7 0 1 0 9 0" />
  </svg>
);

/** App mark used in brand lockups — abstract, calm, no ribbon clichés. */
export const BrandMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="url(#baGrad)" />
    <path
      d="M12 25.5c2.8-4.8 6-7.2 9.6-7.2 2.6 0 4.8 1.2 6.6 3.6"
      stroke="rgba(255,255,255,0.95)"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M13.5 18.5c2.2-3.2 4.7-4.8 7.5-4.8"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="26.5" cy="26" r="2.6" fill="#f0c9a8" />
    <defs>
      <linearGradient id="baGrad" x1="0" y1="0" x2="40" y2="40">
        <stop stopColor="#2d8a81" />
        <stop offset="1" stopColor="#17554f" />
      </linearGradient>
    </defs>
  </svg>
);
