import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './lib/app-context';
import { AppShell } from './components/AppShell';
import { RequireSignedOut, RequireVault } from './components/guards';
import { LandingPage } from './routes/Landing';
import { LoginPage } from './routes/Login';
import { SignupPage } from './routes/Signup';
import { OnboardingPage } from './routes/Onboarding';
import { HomePage } from './routes/Home';
import { MyNormalPage } from './routes/MyNormal';
import { RecordPage } from './routes/Record';
import { ObservationDetailPage } from './routes/ObservationDetail';
import { TimelinePage } from './routes/Timeline';
import { QuestionsPage } from './routes/Questions';
import { PrepareListPage, PrepareWizardPage } from './routes/Prepare';
import { SummaryListPage, SummaryViewPage } from './routes/Summary';
import { ScreeningPage } from './routes/Screening';
import { EducationArticlePage, EducationIndexPage } from './routes/Education';
import { VaultPage } from './routes/Vault';
import { SettingsRoutes } from './routes/Settings';
import { NotFoundPage } from './routes/NotFound';

/** Document titles carry page names only — never record content (§21). */
const TITLES: Record<string, string> = {
  '/': 'BreastAware — Private Breast-Health Organizer',
  '/login': 'Sign in — BreastAware',
  '/signup': 'Create profile — BreastAware',
  '/onboarding': 'Welcome — BreastAware',
  '/home': 'Home — BreastAware',
  '/my-normal': 'My Normal — BreastAware',
  '/record': 'Record a Change — BreastAware',
  '/timeline': 'My Timeline — BreastAware',
  '/questions': 'Questions — BreastAware',
  '/prepare': 'Prepare for a Visit — BreastAware',
  '/summary': 'Health Summary — BreastAware',
  '/screening': 'Screening & Appointments — BreastAware',
  '/education': 'Education — BreastAware',
  '/vault': 'Health Vault — BreastAware',
  '/settings': 'Privacy & Settings — BreastAware',
};

function RouteTitle() {
  const location = useLocation();
  const path = location.pathname;
  const base = '/' + (path.split('/').filter(Boolean)[0] ?? '');
  // Static map only — record content and notes never enter document titles (§21).
  document.title = TITLES[path] ?? TITLES[base] ?? (base === '/observations' ? 'Observation — BreastAware' : 'BreastAware');
  return null;
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <RouteTitle />
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <RequireSignedOutGate>
                <LandingPage />
              </RequireSignedOutGate>
            }
          />
          <Route
            path="/login"
            element={
              <RequireSignedOut>
                <LoginPage />
              </RequireSignedOut>
            }
          />
          <Route
            path="/signup"
            element={
              <RequireSignedOut>
                <SignupPage />
              </RequireSignedOut>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RequireVault>
                <OnboardingPage />
              </RequireVault>
            }
          />
          <Route
            path="/education"
            element={
              <PublicShell>
                <EducationIndexPage />
              </PublicShell>
            }
          />
          <Route
            path="/education/:slug"
            element={
              <PublicShell>
                <EducationArticlePage />
              </PublicShell>
            }
          />

          {/* App (protected) */}
          <Route
            element={
              <RequireVault>
                <AppShell />
              </RequireVault>
            }
          >
            <Route path="/home" element={<HomePage />} />
            <Route path="/my-normal" element={<MyNormalPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/observations/:id" element={<ObservationDetailPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/prepare" element={<PrepareListPage />} />
            <Route path="/prepare/:id" element={<PrepareWizardPage />} />
            <Route path="/summary" element={<SummaryListPage />} />
            <Route path="/summary/:id" element={<SummaryViewPage />} />
            <Route path="/screening" element={<ScreeningPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/settings/*" element={<SettingsRoutes />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

/** Landing stays public; if a session is already unlocked, show it as-is (demo preview). */
function RequireSignedOutGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Education readable without unlocking — static, source-backed content only. */
function PublicShell({ children }: { children: React.ReactNode }) {
  const { status } = useApp();
  const homePath = status === 'ready' ? '/home' : '/';

  return (
    <div className="marketing" style={{ minHeight: '100dvh' }}>
      <header className="marketing__bar">
        <Link to={homePath} className="brand" aria-label="BreastAware home">
          <span className="brand__mark" aria-hidden="true" />
          <span>
            <span className="brand__name">BreastAware</span>
            <span className="brand__tag">Education</span>
          </span>
        </Link>
        <Link to={homePath} className="btn btn--secondary btn--sm">
          {status === 'ready' ? 'Back to app home' : 'Home'}
        </Link>
      </header>
      <main id="main" style={{ maxWidth: '52rem', margin: '0 auto', padding: '1rem 1rem 4rem' }}>
        {children}
      </main>
    </div>
  );
}
