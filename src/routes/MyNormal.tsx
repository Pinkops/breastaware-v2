import { useState, type FormEvent } from 'react';
import { useApp } from '../lib/app-context';
import { Banner, Button, Field, PageHead, TextArea, LinkButton, SuccessPanel } from '../components/primitives';
import { IconEye, IconEdit } from '../components/icons';
import { formatDay, nowISO, todayISODate, uid } from '../lib/util';

interface SectionDef {
  key: keyof Sections;
  label: string;
  hint: string;
  placeholder: string;
}

interface Sections {
  usualLook: string;
  usualFeel: string;
  sizeShape: string;
  texture: string;
  nipples: string;
  cycleChanges: string;
  asymmetry: string;
  otherNotes: string;
}

const SECTION_DEFS: SectionDef[] = [
  {
    key: 'usualLook',
    label: 'Usual look',
    hint: 'How your breasts typically look — skin, shape at rest, anything you have always noticed.',
    placeholder: 'e.g. Even skin tone; no dimpling I am aware of…',
  },
  {
    key: 'usualFeel',
    label: 'Usual feel',
    hint: 'The typical texture when you lie down or shower — what feels ordinary for you.',
    placeholder: 'e.g. Soft overall, slightly granular near the outer edge…',
  },
  {
    key: 'sizeShape',
    label: 'Size and shape',
    hint: 'Your usual size and shape, and anything stable for years.',
    placeholder: 'e.g. Similar size, stable shape…',
  },
  { key: 'texture', label: 'Texture', hint: 'Firm, soft, lumpy, smooth — your normal range.', placeholder: 'e.g. Slightly lumpy in the outer half…' },
  {
    key: 'nipples',
    label: 'Nipples and areola',
    hint: 'Usual appearance, direction, and any long-standing traits.',
    placeholder: 'e.g. Both point slightly outward; no discharge at baseline…',
  },
  {
    key: 'cycleChanges',
    label: 'Cycle-related changes',
    hint: 'Tenderness, lumpiness, or size shifts that come with your menstrual cycle.',
    placeholder: 'e.g. Tenderness the week before my period…',
  },
  {
    key: 'asymmetry',
    label: 'Long-standing asymmetry',
    hint: 'Differences between left and right that have always been there.',
    placeholder: 'e.g. Left slightly larger and a little lower…',
  },
  {
    key: 'otherNotes',
    label: 'Other personal notes',
    hint: 'Anything else useful as a reference point — surgeries, when you usually notice things, etc.',
    placeholder: 'e.g. I notice things most easily lying down in the evening…',
  },
];

const EMPTY: Sections = {
  usualLook: '',
  usualFeel: '',
  sizeShape: '',
  texture: '',
  nipples: '',
  cycleChanges: '',
  asymmetry: '',
  otherNotes: '',
};

export function MyNormalPage() {
  const { data } = useApp();
  if (!data) return null;
  return data.baseline ? <BaselineView /> : <BaselineCreate />;
}

function BaselineCreate() {
  const { update } = useApp();
  const [sections, setSections] = useState<Sections>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const filled = Object.values(sections).some((v) => v.trim().length > 0);
    if (!filled) {
      setError('Add at least a few words about what is usual for you.');
      return;
    }
    setError('');
    const ts = nowISO();
    update((d) => ({
      ...d,
      baseline: {
        id: uid(),
        ...sections,
        createdAt: ts,
        updatedAt: ts,
        lastReviewedAt: null,
      },
    }));
    setSaved(true);
    window.scrollTo(0, 0);
  }

  if (saved) {
    return (
      <div className="shell__main--narrow" style={{ margin: '0 auto' }}>
        <SuccessPanel
          title="Your baseline is recorded."
          actions={
            <>
              <LinkButton to="/home">Go to Home</LinkButton>
              <LinkButton to="/record" variant="secondary">
                Record a Change
              </LinkButton>
            </>
          }
        >
          This is your personal reference point. BreastAware does not determine whether something is medically normal
          or abnormal — you can review and update it anytime.
        </SuccessPanel>
      </div>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Know"
        title="My Normal"
        lede="Describe what is usual for you. This becomes the reference point for everything you record later."
      />

      <div style={{ maxWidth: '42rem' }}>
        <Banner tone="info">
          This is your personal baseline. BreastAware does not determine whether something is medically normal or
          abnormal.
        </Banner>

        <form onSubmit={onSubmit} className="mt-6" noValidate>
          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}

          <div className="card card--pad-lg">
            <p className="card__title">What is usual for you?</p>
            <p className="hint">
              Fill in as much or as little as you like — only what matters to you. You can edit this later.
            </p>
            {SECTION_DEFS.map((def) => (
              <Field key={def.key} label={def.label} htmlFor={`bn-${def.key}`} hint={def.hint}>
                <TextArea
                  id={`bn-${def.key}`}
                  rows={3}
                  value={sections[def.key]}
                  placeholder={def.placeholder}
                  onChange={(e) => setSections((s) => ({ ...s, [def.key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>

          <div className="btn-row mt-6">
            <Button type="submit" size="lg">
              Save My Normal
            </Button>
            <LinkButton to="/home" variant="ghost">
              Cancel
            </LinkButton>
          </div>
        </form>
      </div>
    </>
  );
}

function BaselineView() {
  const { data, update } = useApp();
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const baseline = data!.baseline!;
  const [sections, setSections] = useState<Sections>({
    usualLook: baseline.usualLook,
    usualFeel: baseline.usualFeel,
    sizeShape: baseline.sizeShape,
    texture: baseline.texture,
    nipples: baseline.nipples,
    cycleChanges: baseline.cycleChanges,
    asymmetry: baseline.asymmetry,
    otherNotes: baseline.otherNotes,
  });

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    update((d) =>
      d.baseline
        ? { ...d, baseline: { ...d.baseline, ...sections, updatedAt: nowISO() } }
        : d,
    );
    setEditing(false);
    setJustSaved(true);
    window.scrollTo(0, 0);
  }

  function reviewNow() {
    update((d) => (d.baseline ? { ...d, baseline: { ...d.baseline, lastReviewedAt: todayISODate() } } : d));
    setJustSaved(true);
  }

  const filled = SECTION_DEFS.filter((s) => (baseline[s.key] ?? '').trim());

  return (
    <>
      <PageHead
        eyebrow="Know"
        title="My Normal"
        lede="Your personal baseline. Review it every so often and update it when your usual changes."
        actions={
          <>
            <Button variant="secondary" onClick={reviewNow}>
              I reviewed this today
            </Button>
            <Button onClick={() => setEditing(true)}>
              <IconEdit style={{ width: 16, height: 16 }} /> Edit
            </Button>
          </>
        }
      />

      <div style={{ maxWidth: '42rem' }}>
        {justSaved && (
          <div style={{ marginBottom: '1rem' }}>
            <Banner tone="ok">Saved. Your baseline is up to date.</Banner>
          </div>
        )}

        <Banner tone="info">
          This is your personal baseline. BreastAware does not determine whether something is medically normal or
          abnormal.
        </Banner>

        <div className="card card--pad-lg mt-4">
          <div className="stat-row" style={{ marginBottom: '1rem' }}>
            <div className="stat">
              <div className="stat__num" style={{ fontSize: 'var(--fs-lg)' }}>
                {formatDay(baseline.updatedAt.slice(0, 10))}
              </div>
              <div className="stat__label">Last updated</div>
            </div>
            <div className="stat">
              <div className="stat__num" style={{ fontSize: 'var(--fs-lg)' }}>
                {baseline.lastReviewedAt ? formatDay(baseline.lastReviewedAt) : 'Not yet'}
              </div>
              <div className="stat__label">Last reviewed</div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={saveEdit}>
              {SECTION_DEFS.map((def) => (
                <Field key={def.key} label={def.label} htmlFor={`edit-${def.key}`} hint={def.hint}>
                  <TextArea
                    id={`edit-${def.key}`}
                    rows={3}
                    value={sections[def.key]}
                    onChange={(e) => setSections((s) => ({ ...s, [def.key]: e.target.value }))}
                  />
                </Field>
              ))}
              <div className="btn-row">
                <Button type="submit">Save changes</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : filled.length === 0 ? (
            <p className="muted">Nothing written yet. Tap Edit to add your first notes.</p>
          ) : (
            <dl className="dl">
              {SECTION_DEFS.map((def) =>
                (baseline[def.key] ?? '').trim() ? (
                  <div className="dl__row" key={def.key}>
                    <dt>{def.label}</dt>
                    <dd style={{ whiteSpace: 'pre-wrap' }}>{baseline[def.key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
        </div>

        <div className="mt-4" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <IconEye style={{ width: 18, height: 18, color: 'var(--accent)', flexShrink: 0, marginTop: 3 }} />
          <p className="small muted mb-0">
            Tip: your baseline is most useful when something new appears — it helps you describe what changed rather
            than trying to remember everything at the appointment.
          </p>
        </div>
      </div>
    </>
  );
}
