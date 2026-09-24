import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData } from './types';
import type { SessionKey } from './crypto';
import { deriveSessionKey } from './crypto';
import {
  clearDemo,
  hasProfile,
  isDemoMode,
  loadVault,
  readDemo,
  readEnvelope,
  saveVault,
  setDemoMode,
  wipeEverything,
  writeDemo,
  writeNewVault,
} from './storage';
import { emptyData, migrate, seedDemoData } from './store';
import { friendlyError } from './util';

export type VaultStatus = 'loading' | 'no-profile' | 'locked' | 'ready';

interface AppContextValue {
  status: VaultStatus;
  mode: 'real' | 'demo';
  data: AppData | null;
  /** Present only while unlocked in real mode (used for file crypto & export). */
  session: SessionKey | null;
  error: string;
  busy: boolean;
  createProfile(displayName: string, passphrase: string): Promise<void>;
  unlock(passphrase: string): Promise<boolean>;
  lock(): void;
  update(mutator: (draft: AppData) => AppData): void;
  enterDemo(): void;
  exitDemo(clearData?: boolean): void;
  resetDemo(): void;
  deleteEverything(): Promise<void>;
  clearError(): void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 350;

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'real' | 'demo'>(() => (isDemoMode() ? 'demo' : 'real'));
  const [status, setStatus] = useState<VaultStatus>('loading');
  const [data, setData] = useState<AppData | null>(null);
  const [session, setSession] = useState<SessionKey | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sessionRef = useRef<SessionKey | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const modeRef = useRef(mode);
  const saveTimer = useRef<number | null>(null);
  const lockTimer = useRef<number | null>(null);
  const lastActivity = useRef(Date.now());

  dataRef.current = data;
  modeRef.current = mode;

  /* ---------- initial load ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemoMode()) {
        const demo = readDemo() ?? seedDemoData();
        writeDemo(demo);
        if (!cancelled) {
          setMode('demo');
          setData(demo);
          setStatus('ready');
        }
        return;
      }
      if (!hasProfile()) {
        if (!cancelled) setStatus('no-profile');
        return;
      }
      if (!cancelled) setStatus('locked');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- debounced persistence ---------- */
  const persist = useCallback((next: AppData) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (modeRef.current === 'demo') {
        writeDemo(next);
      } else if (sessionRef.current) {
        saveVault(next, sessionRef.current).catch((err) => {
          setError(friendlyError(err, 'We could not save your changes on this device.'));
        });
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const update = useCallback(
    (mutator: (draft: AppData) => AppData) => {
      const current = dataRef.current;
      if (!current) return;
      const next = mutator(structuredClone(current));
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  /* ---------- auto-lock ---------- */
  const lock = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    setData(null);
    dataRef.current = null;
    setError('');
    if (modeRef.current === 'demo') {
      setMode('real');
      setDemoMode(false);
      setStatus(hasProfile() ? 'locked' : 'no-profile');
    } else {
      setStatus(hasProfile() ? 'locked' : 'no-profile');
    }
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
  }, []);

  const scheduleAutoLock = useCallback(
    (minutes: number) => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
      const ms = Math.max(1, minutes) * 60_000;
      lockTimer.current = window.setTimeout(() => {
        if (Date.now() - lastActivity.current >= ms - 100) lock();
      }, ms);
    },
    [lock],
  );

  useEffect(() => {
    if (status !== 'ready' || !data) return;
    const minutes = data.settings.autoLockMinutes;
    const onActivity = () => {
      lastActivity.current = Date.now();
      scheduleAutoLock(minutes);
    };
    onActivity();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'focus'];
    events.forEach((e) => window.addEventListener(e, onActivity));
    document.addEventListener('visibilitychange', onActivity);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onActivity);
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, [status, data?.settings.autoLockMinutes, scheduleAutoLock, data]);

  /* ---------- auth flows ---------- */
  const createProfile = useCallback(
    async (displayName: string, passphrase: string) => {
      setBusy(true);
      setError('');
      try {
        const fresh = emptyData(displayName.trim() || 'Me');
        const newSession = await writeNewVault(fresh, passphrase);
        sessionRef.current = newSession;
        setSession(newSession);
        setMode('real');
        setDemoMode(false);
        setData(fresh);
        dataRef.current = fresh;
        setStatus('ready');
      } catch (err) {
        setError(friendlyError(err, 'We could not create your local profile. Please try again.'));
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const unlock = useCallback(
    async (passphrase: string): Promise<boolean> => {
      setBusy(true);
      setError('');
      try {
        const envelope = readEnvelope();
        if (!envelope) {
          setStatus('no-profile');
          return false;
        }
        const s = await deriveSessionKey(passphrase, envelope);
        const loaded = migrate(await loadVault(envelope, s));
        sessionRef.current = s;
        setSession(s);
        setData(loaded);
        dataRef.current = loaded;
        setStatus('ready');
        return true;
      } catch (err) {
        setError(friendlyError(err, 'We could not open your data. Please try again.'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  /* ---------- demo mode ---------- */
  const enterDemo = useCallback(() => {
    const existing = readDemo();
    const demo = existing ?? seedDemoData();
    writeDemo(demo);
    setDemoMode(true);
    setMode('demo');
    setData(demo);
    dataRef.current = demo;
    sessionRef.current = null;
    setSession(null);
    setStatus('ready');
    setError('');
  }, []);

  const exitDemo = useCallback(
    (clearData = true) => {
      if (clearData) clearDemo();
      setMode('real');
      setData(null);
      dataRef.current = null;
      setStatus(hasProfile() ? 'locked' : 'no-profile');
      setError('');
    },
    [],
  );

  const resetDemo = useCallback(() => {
    const fresh = seedDemoData();
    writeDemo(fresh);
    setData(fresh);
    dataRef.current = fresh;
  }, []);

  const deleteEverything = useCallback(async () => {
    setBusy(true);
    try {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      await wipeEverything();
      sessionRef.current = null;
      setSession(null);
      setData(null);
      dataRef.current = null;
      setMode('real');
      setStatus('no-profile');
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      mode,
      data,
      session,
      error,
      busy,
      createProfile,
      unlock,
      lock,
      update,
      enterDemo,
      exitDemo,
      resetDemo,
      deleteEverything,
      clearError: () => setError(''),
    }),
    [status, mode, data, session, error, busy, createProfile, unlock, lock, update, enterDemo, exitDemo, resetDemo, deleteEverything],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Throwaway helper for pages that must have data (inside protected routes). */
export function useData(): AppData {
  const { data } = useApp();
  if (!data) throw new Error('Data requested outside an unlocked vault');
  return data;
}
