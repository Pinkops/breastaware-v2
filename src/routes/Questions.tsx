import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app-context';
import {
  Badge,
  Banner,
  Button,
  CheckRow,
  EmptyState,
  Field,
  LinkButton,
  PageHead,
  SegmentedControl,
  TextArea,
} from '../components/primitives';
import { IconPlus, IconQuestion, IconTrash, IconCheck } from '../components/icons';
import { friendlyError, formatDay, nowISO, uid } from '../lib/util';
import type { QuestionStatus } from '../lib/types';

type Filter = 'all' | 'open' | 'discussed' | 'answered';

export function QuestionsPage() {
  const { data, update } = useApp();
  const [params] = useSearchParams();
  const focus = params.get('focus');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [important, setImportant] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (focus) setFilter('all');
  }, [focus]);

  const list = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.questions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === 'all') return sorted;
    return sorted.filter((q) => q.status === filter);
  }, [data, filter]);

  if (!data) return null;

  function addQuestion(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) {
      setError('Write your question first.');
      return;
    }
    setError('');
    try {
      update((d) => ({
        ...d,
        questions: [
          {
            id: uid(),
            text: t,
            priority: important ? 'important' : 'normal',
            status: 'open' as QuestionStatus,
            includeInSummary: true,
            relatedObsIds: [],
            createdAt: nowISO(),
            updatedAt: nowISO(),
          },
          ...d.questions,
        ],
      }));
      setText('');
      setImportant(false);
      setAdding(false);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function setStatus(id: string, status: QuestionStatus) {
    update((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, status, updatedAt: nowISO() } : q)),
    }));
  }

  function toggleSummary(id: string) {
    update((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === id ? { ...q, includeInSummary: !q.includeInSummary } : q)),
    }));
  }

  function togglePriority(id: string) {
    update((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id === id ? { ...q, priority: q.priority === 'important' ? 'normal' : 'important' } : q,
      ),
    }));
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId || !editText.trim()) return;
    update((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === editingId ? { ...q, text: editText.trim(), updatedAt: nowISO() } : q)),
    }));
    setEditingId(null);
  }

  function remove(id: string) {
    if (!window.confirm('Delete this question permanently?')) return;
    update((d) => ({
      ...d,
      questions: d.questions.filter((q) => q.id !== id),
      preparations: d.preparations.map((p) => ({ ...p, questionIds: p.questionIds.filter((x) => x !== id) })),
    }));
  }

  return (
    <>
      <PageHead
        eyebrow="Organize"
        title="Questions for your healthcare professional"
        lede="Capture questions as they occur to you, prioritize them, and choose which ones ride along into your visit summary. BreastAware organizes questions — it does not answer them."
        actions={
          <Button onClick={() => setAdding(true)}>
            <IconPlus style={{ width: 16, height: 16 }} /> Add a question
          </Button>
        }
      />

      <div style={{ marginBottom: '1.25rem' }} className="no-print">
        <SegmentedControl
          label="Filter questions"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'discussed', label: 'Discussed' },
            { id: 'answered', label: 'Answered' },
          ]}
        />
      </div>

      {adding && (
        <form onSubmit={addQuestion} className="card" style={{ marginBottom: '1rem' }}>
          <Field label="Your question" htmlFor="new-q" error={error || undefined}>
            <TextArea
              id="new-q"
              rows={3}
              autoFocus
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Should this be examined, or is it likely cycle-related?"
            />
          </Field>
          <CheckRow id="q-important" checked={important} onChange={setImportant}>
            Mark as <strong>important</strong> — pinned to the top of your list.
          </CheckRow>
          <div className="btn-row mt-4">
            <Button type="submit">Save question</Button>
            <Button variant="ghost" onClick={() => { setAdding(false); setError(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Banner tone="info" >
        The app will never answer medical questions with invented advice. It helps you ask them clearly instead.
      </Banner>

      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? 'No questions yet' : `No ${filter} questions`}
            icon={<IconQuestion />}
            action={
              <Button onClick={() => setAdding(true)}>
                <IconPlus style={{ width: 16, height: 16 }} /> Add a question
              </Button>
            }
          >
            Jot down anything you want to ask at your next visit — you can prioritize and include them in your summary.
          </EmptyState>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} aria-label="Questions">
            {list.map((q) => {
              const focused = focus === q.id;
              return (
                <li key={q.id} className={`list-item${q.status !== 'open' ? ' list-item--done' : ''}`} style={focused ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : undefined}>
                  <div className="list-item__body">
                    {editingId === q.id ? (
                      <form onSubmit={saveEdit}>
                        <Field label="Edit question" htmlFor={`edit-${q.id}`}>
                          <TextArea id={`edit-${q.id}`} rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                        </Field>
                        <div className="btn-row">
                          <Button type="submit" size="sm">Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="list-item__title">
                          {q.priority === 'important' && (
                            <Badge tone="warm">Important</Badge>
                          )}{' '}
                          {q.text}
                        </div>
                        <div className="list-item__meta">
                          <Badge tone={q.status === 'open' ? 'accent' : 'ok'}>
                            {q.status === 'open' ? 'Open' : q.status === 'answered' ? 'Answered' : 'Discussed'}
                          </Badge>
                          <Badge tone={q.includeInSummary ? 'accent' : 'muted'}>
                            {q.includeInSummary ? 'In summary' : 'Excluded from summary'}
                          </Badge>
                          <span>Added {formatDay(q.createdAt.slice(0, 10))}</span>
                        </div>
                        <div className="list-item__actions">
                          {q.status === 'open' ? (
                            <Button size="sm" variant="secondary" onClick={() => setStatus(q.id, 'discussed')}>
                              Mark discussed
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => setStatus(q.id, 'open')}>
                              <IconCheck style={{ width: 14, height: 14 }} /> Reopen
                            </Button>
                          )}
                          {q.status === 'discussed' && (
                            <Button size="sm" variant="secondary" onClick={() => setStatus(q.id, 'answered')}>
                              Mark answered
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(q.id);
                              setEditText(q.text);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => togglePriority(q.id)}>
                            {q.priority === 'important' ? 'Unpin' : 'Mark important'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleSummary(q.id)}>
                            {q.includeInSummary ? 'Exclude from summary' : 'Include in summary'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(q.id)} aria-label="Delete question">
                            <IconTrash style={{ width: 14, height: 14 }} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="btn-row mt-6">
        <LinkButton to="/prepare" variant="secondary">
          Prepare for a Visit
        </LinkButton>
        <LinkButton to="/timeline" variant="ghost">
          View timeline
        </LinkButton>
      </div>
    </>
  );
}
