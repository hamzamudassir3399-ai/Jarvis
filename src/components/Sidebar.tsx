import { AlarmClock, CheckCircle2, Circle, StickyNote, Trash2, X } from 'lucide-react';
import { setState, useJarvisState } from '../lib/store';
import type { Priority } from '../types';

const priorityColor: Record<Priority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

function formatDue(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { tasks, notes, reminders } = useJarvisState();
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const upcoming = reminders.filter((r) => !r.fired);

  const toggle = (id: string) =>
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  const removeTask = (id: string) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  const removeNote = (id: string) => setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  const removeReminder = (id: string) => setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your day</h2>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 lg:hidden" aria-label="Close panel">
            <X size={16} />
          </button>
        )}
      </div>

      <section className="mb-6">
        <h3 className="mb-2 flex items-center gap-2 font-medium text-zinc-200">
          <CheckCircle2 size={16} className="text-cyan-400" /> Tasks
          <span className="ml-auto text-xs text-zinc-500">{pending.length} open</span>
        </h3>
        {tasks.length === 0 && <p className="text-xs text-zinc-500">No tasks yet. Try “add a task to call mom tomorrow at 6pm”.</p>}
        <ul className="space-y-1">
          {[...pending, ...done].map((t) => (
            <li key={t.id} className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/70">
              <button onClick={() => toggle(t.id)} className="mt-0.5 text-zinc-400 hover:text-cyan-400" aria-label="Toggle task">
                {t.done ? <CheckCircle2 size={16} className="text-cyan-400" /> : <Circle size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`truncate ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{t.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${priorityColor[t.priority]}`} />
                  {t.priority}
                  {t.dueDate && <span>· due {formatDue(t.dueDate)}</span>}
                </div>
              </div>
              <button onClick={() => removeTask(t.id)} className="invisible text-zinc-500 hover:text-rose-400 group-hover:visible" aria-label="Delete task">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 flex items-center gap-2 font-medium text-zinc-200">
          <AlarmClock size={16} className="text-amber-400" /> Reminders
          <span className="ml-auto text-xs text-zinc-500">{upcoming.length}</span>
        </h3>
        {upcoming.length === 0 && <p className="text-xs text-zinc-500">No upcoming reminders.</p>}
        <ul className="space-y-1">
          {upcoming.map((r) => (
            <li key={r.id} className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/70">
              <div className="min-w-0 flex-1">
                <div className="truncate text-zinc-100">{r.message}</div>
                <div className="text-[11px] text-zinc-500">{formatDue(r.time)}</div>
              </div>
              <button onClick={() => removeReminder(r.id)} className="invisible text-zinc-500 hover:text-rose-400 group-hover:visible" aria-label="Cancel reminder">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 font-medium text-zinc-200">
          <StickyNote size={16} className="text-violet-400" /> Notes
          <span className="ml-auto text-xs text-zinc-500">{notes.length}</span>
        </h3>
        {notes.length === 0 && <p className="text-xs text-zinc-500">No notes saved.</p>}
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-md border border-zinc-800 bg-zinc-900 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-zinc-100">{n.title}</div>
                <button onClick={() => removeNote(n.id)} className="invisible text-zinc-500 hover:text-rose-400 group-hover:visible" aria-label="Delete note">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{n.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
