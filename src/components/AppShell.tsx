import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import { Modal } from './Modal';
import {
  BrandMark,
  IconHome,
  IconTimeline,
  IconPlus,
  IconPrep,
  IconMore,
  IconBook,
  IconCalendar,
  IconDoc,
  IconShield,
  IconQuestion,
  IconSpark,
  IconLock,
  IconPin,
  IconEye,
  IconPower,
} from './icons';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const DESKTOP_PRIMARY: NavItem[] = [
  { to: '/home', label: 'Home', icon: <IconHome /> },
  { to: '/my-normal', label: 'My Normal', icon: <IconEye /> },
  { to: '/record', label: 'Record a Change', icon: <IconPlus /> },
  { to: '/timeline', label: 'My Timeline', icon: <IconTimeline /> },
  { to: '/prepare', label: 'Prepare for a Visit', icon: <IconPrep /> },
  { to: '/screening', label: 'Screening & Appointments', icon: <IconCalendar /> },
  { to: '/summary', label: 'Health Summary', icon: <IconDoc /> },
  { to: '/questions', label: 'Questions', icon: <IconQuestion /> },
  { to: '/education', label: 'Education', icon: <IconBook /> },
  { to: '/settings/privacy', label: 'Privacy & Settings', icon: <IconShield /> },
];

const MORE_LINKS: Array<{ to: string; label: string; icon: React.ReactNode }> = [
  { to: '/my-normal', label: 'My Normal', icon: <IconEye /> },
  { to: '/questions', label: 'Questions', icon: <IconQuestion /> },
  { to: '/screening', label: 'Screening & Appointments', icon: <IconCalendar /> },
  { to: '/summary', label: 'Health Summary', icon: <IconDoc /> },
  { to: '/education', label: 'Education', icon: <IconBook /> },
  { to: '/vault', label: 'Health Vault', icon: <IconLock /> },
  { to: '/settings/privacy', label: 'Privacy & Settings', icon: <IconShield /> },
];

export function AppShell() {
  const { mode, data, lock, exitDemo, resetDemo } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isMoreActive = MORE_LINKS.some((l) => location.pathname.startsWith(l.to));

  const closeMore = () => setMoreOpen(false);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {mode === 'demo' && (
        <div className="demo-banner" role="status">
          <span aria-hidden="true">◆</span>
          <span>Demo data — sample records for preview. Not your health information.</span>
          <span className="btn-row" style={{ gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => {
                resetDemo();
                navigate('/home');
              }}
            >
              Reset demo data
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                exitDemo(true);
                navigate('/');
              }}
            >
              Exit demo
            </button>
          </span>
        </div>
      )}

      <div className="shell__body">
      {/* Desktop sidebar */}
      <aside className="sidebar no-print">
        <NavLink to="/home" className="sidebar__brand">
          <span className="sidebar__brand-mark">
            <BrandMark size={36} />
          </span>
          <span>
            <span className="sidebar__brand-name">BreastAware</span>
            <span className="sidebar__tag sidebar__brand-tag">Private organizer</span>
          </span>
        </NavLink>

        <nav aria-label="Main">
          {DESKTOP_PRIMARY.map((item) =>
            item.label === 'Record a Change' ? (
              <NavLink key={item.to} to={item.to} className="sidebar__link sidebar__link--record">
                {item.icon}
                {item.label}
              </NavLink>
            ) : (
              <NavLink key={item.to} to={item.to} className="sidebar__link">
                {item.icon}
                {item.label}
              </NavLink>
            ),
          )}

          <div className="sidebar__divider">Secondary</div>
          <NavLink to="/vault" className="sidebar__link">
            <IconLock />
            Health Vault
          </NavLink>
          <NavLink to="/settings/export" className="sidebar__link">
            <IconDoc />
            Data export
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__meta">
            {mode === 'demo'
              ? 'Demo session'
              : data
                ? `Signed in as ${data.profile.displayName || 'you'}`
                : ''}
          </div>
          <div className="sidebar__meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPin style={{ width: 13, height: 13 }} /> Data stays on this device
          </div>
          <button
            type="button"
            className="sidebar__link"
            style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit', width: '100%', textAlign: 'left' }}
            onClick={() => {
              if (mode === 'demo') {
                exitDemo(true);
                navigate('/');
              } else {
                void lock().then(() => navigate('/login'));
              }
            }}
          >
            <IconPower />
            {mode === 'demo' ? 'Exit demo' : 'Lock & sign out'}
          </button>
        </div>
      </aside>

      <main id="main" className="shell__main">
        <Outlet />
      </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav no-print" aria-label="Primary">
        <NavLink to="/home" className="bottom-nav__item">
          <IconHome />
          <span>Home</span>
        </NavLink>
        <NavLink to="/timeline" className="bottom-nav__item">
          <IconTimeline />
          <span>Timeline</span>
        </NavLink>
        <NavLink to="/record" className="bottom-nav__item bottom-nav__item--record">
          <span className="record-fab" aria-hidden="true">
            <IconPlus />
          </span>
          <span>Record</span>
        </NavLink>
        <NavLink to="/prepare" className="bottom-nav__item">
          <IconPrep />
          <span>Prepare</span>
        </NavLink>
        <button
          type="button"
          className="bottom-nav__item"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-current={isMoreActive ? 'page' : undefined}
          onClick={() => setMoreOpen(true)}
        >
          <IconMore />
          <span>More</span>
        </button>
      </nav>

      <Modal open={moreOpen} onClose={closeMore} title="More" titleId="more-sheet-title">
        <div className="more-list">
          <div className="sep">Your records</div>
          {MORE_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={closeMore}>
              {l.icon}
              {l.label}
            </NavLink>
          ))}
          <div className="sep">This device</div>
          <button
            type="button"
            onClick={() => {
              closeMore();
              if (mode === 'demo') {
                exitDemo(true);
                navigate('/');
              } else {
                void lock().then(() => navigate('/login'));
              }
            }}
          >
            <IconPower />
            {mode === 'demo' ? 'Exit demo' : 'Lock & sign out'}
          </button>
          <button type="button" onClick={() => { closeMore(); navigate('/'); }}>
            <IconSpark />
            About BreastAware
          </button>
        </div>
      </Modal>
    </div>
  );
}

export { DESKTOP_PRIMARY };
