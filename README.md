# BreastAware V2

**Private Breast-Health Organizer** — a mobile-first, installable PWA that helps a person know their personal baseline, record changes over time, organize relevant history, and prepare for healthcare conversations.

> Know your baseline. Record what you notice. Prepare for the conversation.

**BreastAware is NOT a diagnostic product.** It does not determine whether a breast change is cancer, benign, dangerous, normal, abnormal, or medically significant. It does not replace professional medical care.

---

## The one workflow

```text
KNOW → RECORD → ORGANIZE → PREPARE → SUMMARIZE

My Normal → Record a Change → Body Map marker → My Timeline
    → Questions → Prepare for a Visit → Health Summary (print / PDF)
```

## Architecture (honest by design)

There is **no backend**. This is a local-first PWA:

| Layer | Implementation |
|---|---|
| UI | React 18 + TypeScript + Vite, hand-rolled design-token CSS |
| Routing | React Router (hash routing so the static build works on any host) |
| Records | Single JSON vault in `localStorage`, encrypted at rest |
| Crypto | Web Crypto: PBKDF2-SHA256 (210k iters, 16-byte salt) → AES-GCM-256; key held in memory only, auto-lock (1–30 min) |
| Documents | Health Vault files encrypted with the session key, stored in IndexedDB (5 MB/file, 25 MB total) |
| Demo mode | Sample data in `sessionStorage` only, permanent "Demo data" banner, one-click reset/exit — never mixes with a real vault |
| PWA | Manifest + icons + service worker caching the **app shell** (records are on-device by design; the SW never touches health data) |
| Entitlement | `src/lib/entitlement.ts` provider interface — swap a Gumroad provider later without touching product code |
| Telemetry | **None.** No analytics, no third-party scripts/fonts/CDNs at runtime, no network calls with health data |

### What the code guarantees (and nothing more)

- One local profile per browser; passcode required to unlock; wrong passcode rejected (AES-GCM authentication).
- Export contains all user-owned records + document bytes (base64).
- Delete wipes vault + IndexedDB document bytes + demo data.
- Health text never appears in URLs, page titles, or logs; errors are human-readable only.
- No secrets in the client bundle (there are none to leak — no backend).

### What is explicitly NOT claimed

Cloud sync, cross-device access, HIPAA/SOC2 certification, penetration-testing, protection against malware or an attacker with an unlocked device. Forgotten passcode = unrecoverable by design (warned at signup; export is the safety net).

## Commands

```bash
npm install
npm run dev        # development server (http://localhost:5173)
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/ on http://localhost:4173
npm test           # unit tests (crypto, summary fidelity, timeline, safety copy)
npm run typecheck  # tsc --noEmit
```

## Screen map

Landing · Login (unlock) · Sign up (local profile) · Onboarding · Home · My Normal · Record a Change (8-step wizard) · Body Map (integrated + non-visual alternative) · Observation Detail · My Timeline · Questions · Prepare for a Visit · Visit Summary (print/PDF) · Screening & Appointments · Education index/article · Health Vault · Privacy Center · Settings (profile, export, delete, about) · 404 · loading/empty/success/error states.

## Education sources

Eight short articles, each with official sources verified at build time (CDC, NCI, NHS, Cancer Council Australia, Health New Zealand, BreastScreen Australia, Breast Cancer Canada, U.S. HHS), plus geography tags and "checked against source" dates. No invented citations.

## Docs

- `docs/IMPLEMENTATION_PLAN.md` — pre-code plan, refactor map, data model, risks
- `docs/AUDIT.md` — full product/UX/accessibility/privacy/security/medical-language/workflow acceptance audit with honest unresolved issues
