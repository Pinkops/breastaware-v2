/** Small, dependency-free helpers. No health data ever enters URLs or titles. */

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Format a YYYY-MM-DD value without timezone shifting (date is user-entered text). */
export function formatDay(date: string): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatDayShort(date: string): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

/** Format an ISO datetime string (appointments use datetime-local input). */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const datePart = `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  const timePart = dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

export function formatTimestamp(iso: string): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return `${WEEKDAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()} at ${dt.toLocaleTimeString(
    [],
    { hour: 'numeric', minute: '2-digit' },
  )}`;
}

export function daysUntil(date: string): number | null {
  if (!date) return null;
  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Human-readable, never leaking internals (§38). */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof Error) {
    if (err.message === 'wrong-passphrase') return 'That passcode did not match. Please try again.';
    if (err.message === 'no-vault') return 'No local profile was found on this device.';
    if (err.message === 'quota-exceeded') return 'This device is out of storage space. Delete a document or export your data.';
    if (err.message === 'storage-unavailable') return 'Browser storage is unavailable. Check your privacy settings and try again.';
  }
  return fallback;
}
