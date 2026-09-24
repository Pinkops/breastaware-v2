import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { IconInfo, IconCheck, IconArrowRight } from './icons';

/* ---------- Button ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', block, className = '', ...rest }: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'lg' ? 'btn--lg' : size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button type="button" className={classes} {...rest} />;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className = '',
  children,
}: {
  to: string;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'lg' ? 'btn--lg' : size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
}

/* ---------- Banner ---------- */

export function Banner({
  tone = 'info',
  children,
  icon = true,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'ok';
  children: ReactNode;
  icon?: boolean;
}) {
  return (
    <div className={`banner banner--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {icon && <IconInfo />}
      <div>{children}</div>
    </div>
  );
}

/* ---------- Fields ---------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="optional"> · optional</span>}
      </label>
      {hint && (
        <p className="hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="error-text" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ id, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input id={id} className="input" {...rest} />;
}

export function TextArea({ id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea id={id} className="textarea" {...rest} />;
}

export function Select({ id, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select id={id} className="select" {...rest}>
      {children}
    </select>
  );
}

export interface ChoiceOption<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

export function RadioCards<T extends string>({
  name,
  value,
  options,
  onChange,
  legend,
  hint,
  error,
  columns = 1,
}: {
  name: string;
  value: T | null;
  options: Array<ChoiceOption<T>>;
  onChange: (v: T) => void;
  legend: string;
  hint?: string;
  error?: string;
  columns?: 1 | 2;
}) {
  return (
    <fieldset className={`field${error ? ' field--error' : ''}`} style={{ border: 0, padding: 0, margin: '0 0 var(--sp-5)' }}>
      <legend className="label">{legend}</legend>
      {hint && <p className="hint">{hint}</p>}
      <div className={`choices${columns === 2 ? ' choices--2' : ''}`} role="radiogroup" aria-label={legend}>
        {options.map((opt) => (
          <label className="choice" key={opt.id}>
            <input
              type="radio"
              name={name}
              value={opt.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <span className="choice__body">
              <span className="choice__label">{opt.label}</span>
              {opt.hint && <span className="choice__hint">{opt.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function CheckRow({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  id: string;
}) {
  return (
    <label className="check-row" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  block = false,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
  block?: boolean;
}) {
  return (
    <div className={`seg${block ? ' seg--block' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="seg__btn"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  title,
  children,
  action,
  icon,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden="true">
        {icon ?? <IconInfo />}
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

/* ---------- Page heading ---------- */

export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 16rem' }}>
          <h1 style={{ marginBottom: lede ? '0.5rem' : 0 }}>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
        </div>
        {actions && <div className="btn-row no-print">{actions}</div>}
      </div>
    </header>
  );
}

export function Badge({ tone, children }: { tone?: 'accent' | 'warm' | 'ok' | 'muted'; children: ReactNode }) {
  return <span className={`badge${tone ? ` badge--${tone}` : ''}`}>{children}</span>;
}

export function Spinner({ large }: { large?: boolean }) {
  return <span className={`spinner${large ? ' spinner--lg' : ''}`} role="status" aria-label="Loading" />;
}

export function SuccessPanel({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="card card--pad-lg" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <div
        className="empty__icon"
        style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}
        aria-hidden="true"
      >
        <IconCheck />
      </div>
      <h2 style={{ fontSize: 'var(--fs-xl)' }}>{title}</h2>
      <div className="muted" style={{ maxWidth: '26rem', margin: '0 auto 1.5rem' }}>
        {children}
      </div>
      <div className="btn-row btn-row--center">{actions}</div>
    </div>
  );
}

export function TextAction({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="link-quiet" {...rest}>
      {children}
    </button>
  );
}

export { IconArrowRight, IconCheck, IconInfo };
