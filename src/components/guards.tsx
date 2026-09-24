import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Spinner } from './primitives';

/** Route guard: no health data renders without an unlocked vault (or demo session).
 * The `next` parameter carries only a route path — never health information. */
export function RequireVault({ children }: { children: ReactNode }) {
  const { status, data, mode } = useApp();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="loading-veil" role="status">
        <Spinner large />
        <p>Opening BreastAware…</p>
      </div>
    );
  }

  if (mode === 'demo' && data) return <>{children}</>;

  if (status === 'no-profile') return <Navigate to="/signup" replace />;
  if (status === 'locked' || !data) {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <>{children}</>;
}

/** Already has a profile and just needs unlocking (signup/login pages). */
export function RequireSignedOut({ children }: { children: ReactNode }) {
  const { status, data, mode } = useApp();
  if (status === 'loading') {
    return (
      <div className="loading-veil" role="status">
        <Spinner large />
      </div>
    );
  }
  if (mode === 'demo' && data) return <Navigate to="/home" replace />;
  if (status === 'ready' && data) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
