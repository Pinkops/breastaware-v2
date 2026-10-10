# BreastAware V2 production audit

Audit date: 2026-10-10  
Audited revision baseline: `099b37b3f4f7f6ef2c903f2a89db8c278079f27b`  
Scope: repository and local production build. The hosted Vercel URL could not be reached from the restricted audit environment, so deployed headers, HTTPS behavior, and live service-worker state remain deployment checks.

## Executive summary

**Release status: CONDITIONALLY READY**

No P0 or unresolved P1 defect remains in the audited source. The baseline compiled and its 20 unit tests passed, but dependency scanning found 9 known vulnerabilities (2 critical). The audit also confirmed a last-edit data-loss race during lock, failure to enforce the advertised 25 MB document-vault limit, and absent deployment security headers. These issues were corrected and the source was rebuilt and retested. Final automated checks pass, including 22 unit tests and an audit with zero known vulnerabilities.

Release remains conditional because a real browser executable and outbound access to the Vercel host were unavailable. Browser E2E, assistive-technology review, fresh install/update/offline behavior, responsive visual review, and post-deployment headers therefore require the manual release checklist below. This report does not claim WCAG conformance, clinical certification, penetration testing, or absence of undiscovered defects.

## System inspected

- React 18, TypeScript, Vite static SPA using `HashRouter`; Vercel hosting.
- No backend, API, remote authentication, database, analytics, or production environment variables.
- Local encrypted profile: PBKDF2-SHA-256 (210,000 iterations) and AES-GCM-256 in `localStorage`; in-memory key.
- Encrypted documents in IndexedDB; demo data in `sessionStorage`.
- All tracked source, routes, shared components, styles, manifest, service worker, icons, tests, build configuration, lockfile, and documentation.
- Routes include landing, signup/unlock/onboarding, home, baseline, observation workflow/detail, timeline, questions, visit preparation, summaries, screening, education, document vault, settings/privacy/export/delete, and not-found handling.

## Baseline evidence (before changes)

| Check | Command | Result | Evidence |
|---|---|---|---|
| Working tree | `git status --short --branch` | PASS | Clean branch; no unrelated changes to preserve. |
| Install | `npm ci` | PASS with security failure | Installed 104 packages; reported 9 vulnerabilities: 5 moderate, 2 high, 2 critical. |
| Unit tests | `npm test` | PASS | 4 files, 20 tests passed. |
| TypeScript | `npm run typecheck` | PASS | No diagnostics. |
| Production build | `npm run build` | PASS | Vite 5 build completed; JS 162.14 + 164.78 kB raw, CSS 34.82 kB raw. |
| Lint | package scripts | NOT RUN | No lint script or lint configuration exists. |
| Browser E2E | repository | NOT RUN | Screenshot script exists, but no test assertion suite/package script. |

## Audit register

| ID | Feature/file | Reproduction and actual behavior | Expected behavior | Severity | Root cause | Fix/status | Verification/result |
|---|---|---|---|---|---|---|---|
| BA-001 | Dependency toolchain / lockfile | Run `npm audit`; baseline reports 9 advisories, including critical Vitest/tinypool RCE-class development-tool advisories and vulnerable Vite/React Router. | Supported dependencies with no known actionable advisories. | P1 | Old broad semver ranges resolved to vulnerable major generations; lockfile was stale. | Updated React Router, Vite, Vitest, React plugin, Playwright, and transitive source-map dependency. **Fixed.** | `npm audit --audit-level=moderate`: zero vulnerabilities; tests/typecheck/build pass. |
| BA-002 | `src/lib/app-context.tsx` persistence/lock | Edit a record and activate Lock within the 350 ms debounce. `lock()` cleared the session key before the timer ran, so `persist()` skipped the write. Concurrent async saves could also finish out of order. | Every accepted update is durably ordered before lock discards the key. | P1 | Debounced writes depended on a mutable session ref and had no serialization/flush barrier. | Replaced timer with an ordered promise queue; saves capture the active key; lock and deletion await pending work. **Fixed.** | Typecheck/build pass; source-path regression inspection complete. Full browser persistence test remains in manual gate because browser unavailable. |
| BA-003 | Health Vault | Add documents whose listed sizes total over 25 MB while each is <=5 MB. UI accepted them despite claiming a 25 MB total limit. | Reject additions exceeding either limit before encryption/storage. | P2 | Only per-file size was validated; aggregate metadata was display-only. | Added reusable capacity validation and cleanup of a partially written IndexedDB record. **Fixed.** | New boundary tests pass (`storage.test.ts`, 2 tests). |
| BA-004 | Vercel/security configuration | Repository had no `vercel.json`; deployed static files had no repository-defined CSP, anti-framing, MIME-sniffing, feature restrictions, or explicit SW cache policy. | Defense-in-depth headers and non-cached SW update checks. | P2 | Deployment headers were unspecified. | Added CSP, HSTS, no-referrer, nosniff, DENY/frame-ancestors, permissions policy, COOP, immutable hashed assets, and no-store SW. **Fixed in source; deployment verification pending.** | JSON/build inspection passes. Must verify with `curl -I` after deployment. |
| BA-005 | Repository hygiene | `npm ci` produced an untracked `node_modules/` tree because no `.gitignore` existed. | Generated dependencies and test artifacts never enter a release patch. | P3 | Missing ignore rules. | Added focused `.gitignore`. **Fixed.** | `git status --short` no longer lists `node_modules`. |
| BA-006 | Browser/PWA/accessibility verification | Playwright smoke procedure could not launch: Chromium executable was not installed; browser download host is outside environment allowlist. Live Vercel host was also inaccessible. | Validate all routes, console/network, keyboard modal, mobile/desktop, offline reload, fresh install and update in real Chromium/WebKit. | P2 observation / release condition | Audit-environment limitation, not a confirmed product defect. | **Unverified.** Manual checklist below is required. | Playwright reported missing `chromium_headless_shell-1248`; local preview HTTP returned 200 and referenced all built assets. |

Confirmed totals: **P0 0, P1 2, P2 2 defects + 1 unverified observation, P3 1**. Fixed: 5 confirmed defects. Unresolved confirmed P0/P1: 0.

## Changes made

- `package.json`, `package-lock.json`: secure supported toolchain/router updates.
- `.gitignore`: dependency, log, coverage, and browser-test artifact exclusions.
- `vite.config.ts`: Vite 8-compatible vendor chunking.
- `src/lib/app-context.tsx`: ordered durable writes and lock/delete flush barriers.
- `src/components/AppShell.tsx`: navigate only after asynchronous lock finishes.
- `src/lib/storage.ts`: testable document-capacity rule.
- `src/lib/storage.test.ts`: per-file and aggregate boundary regressions.
- `src/routes/Vault.tsx`: aggregate limit enforcement and orphan-byte cleanup.
- `vercel.json`: production security and caching headers.

## Final test evidence

| Check | Exact command/procedure | Result | Evidence / limitation |
|---|---|---|---|
| Clean install/lockfile | `npm ci` (baseline), dependency update via npm | PASS | Lockfile updated consistently. A final clean install should also run in CI. |
| Type safety | `npm run typecheck` | PASS | No TypeScript diagnostics. |
| Unit/regression | `npm test` | PASS | 5 files, 22 tests passed after fixes. |
| Security dependencies | `npm audit --audit-level=moderate` | PASS | `found 0 vulnerabilities`. This is dependency scanning, not a penetration test. |
| Production build | `npm run build` | PASS | Vite 8.3.4; 60 modules. CSS 35.01 kB (7.52 gzip); app JS 167.32 kB (43.19 gzip); vendor JS 180.85 kB (59.81 gzip); runtime 0.58 kB. |
| Patch quality | `git diff --check` | PASS | No whitespace errors. |
| Production preview | `npm run preview -- --host 0.0.0.0`; `curl http://localhost:4173/` | PASS (server smoke) | HTTP 200; built hashed JS/CSS references present. |
| Browser route/console/offline smoke | Playwright procedure against preview | BLOCKED | Browser binary missing and download unavailable. No pass claimed. |
| Accessibility | Static semantic/CSS inspection | PARTIAL | Skip link, landmarks, labels, focus-visible, modal focus trap and reduced-motion context observed. No axe/AT/browser run; WCAG conformance not claimed. |
| Performance | Production bundle measurement | PASS (build metric only) | Sizes above are measured. LCP/INP/CLS were not measured; no Lighthouse score claimed. |
| Deployed Vercel | Live URL and response headers | BLOCKED | Host inaccessible from this environment; source configuration only. |

## Production and clinical safety assessment

- Core local-data workflows compile and their existing crypto, summary-fidelity, selector, and safety-copy tests pass.
- No server-side authorization, CORS, CSRF, tenant isolation, migrations, or API contract exists to test; the app is intentionally local-only.
- No secrets or runtime third-party calls were found. Education links are external but use `noopener noreferrer` and the page referrer policy is no-referrer.
- Medical copy clearly states that this is an organizer, not diagnosis or individualized advice. Sources and review dates are represented in content. Source URLs/content were not revalidated because those external hosts are unavailable here; clinical editorial review remains a human responsibility.
- Offline scope is appropriately limited to the application shell and local records. Server-dependent features do not exist. The worker only handles same-origin GET requests and does not cache health API responses.

## Mandatory pre-release manual checks

1. Deploy to a non-production Vercel preview, not the production alias first.
2. Run `npm ci && npm run typecheck && npm test && npm run build && npm audit --audit-level=moderate` in CI.
3. In fresh Chrome and Safari/WebKit profiles, test signup, onboarding, every nav route, observation create/view, questions, appointment, preparation, summary/print, document add/download/delete, export, lock/unlock, wrong passcode, and full deletion.
4. Specifically edit and immediately lock, unlock, and confirm the edit persisted (BA-002 browser regression).
5. Test 390 px, tablet, and desktop widths; keyboard-only navigation; focus return/trapping; 200%/400% zoom; screen reader announcements; reduced motion; and contrast with browser tooling.
6. Install the PWA fresh, reload online once, go offline, cold-start and navigate cached routes. Redeploy a changed build and confirm the worker updates without a broken/mixed release.
7. Verify manifest and every icon in browser Application tooling. Confirm no health content appears in Cache Storage, URLs, titles, logs, or network requests.
8. Measure Lighthouse/WebPageTest or equivalent for LCP, INP, CLS and PWA checks on the deployed preview; record actual values.
9. Verify headers: `curl -I https://<preview>/`, `/sw.js`, `/manifest.webmanifest`, and a hashed `/assets/...` URL. Confirm CSP generates no browser violations.
10. Have a qualified clinical reviewer re-check education language and each linked official source/current review date.

## Final recommendation

The audited source is **CONDITIONALLY READY** for a Vercel preview release. It is not yet evidence-supported as ready for production publication because real-browser and deployed-environment gates are blocked, not because a known P0/P1 remains. Promote only after all mandatory checks above pass and evidence is retained. Do not infer that this audit proves the absence of undiscovered defects or establishes regulatory, clinical, privacy, or WCAG certification.
