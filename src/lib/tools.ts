import type { FunctionCall } from '@google/genai';
import { getState, setState, newId } from './store';
import { evaluate } from './calculator';
import type { Priority, Task } from '../types';

type ToolResult = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function normalizeDate(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function publicTask(t: Task) {
  return { id: t.id, title: t.title, done: t.done, priority: t.priority, dueDate: t.dueDate ?? null };
}

const handlers: Record<string, (args: Record<string, unknown>) => ToolResult> = {
  add_task(args) {
    const title = str(args.title);
    if (!title) return { error: 'title is required' };
    const priority = (['low', 'medium', 'high'].includes(args.priority as string) ? args.priority : 'medium') as Priority;
    const task: Task = {
      id: newId(),
      title,
      done: false,
      priority,
      dueDate: normalizeDate(args.dueDate),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    return { ok: true, task: publicTask(task) };
  },

  list_tasks(args) {
    const filter = (args.filter as string) || 'pending';
    const tasks = getState().tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done));
    return { count: tasks.length, tasks: tasks.map(publicTask) };
  },

  complete_task(args) {
    const id = str(args.id);
    const done = args.done === undefined ? true : Boolean(args.done);
    let found: Task | undefined;
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        found = { ...t, done };
        return found;
      }),
    }));
    return found ? { ok: true, task: publicTask(found) } : { error: `No task with id ${id}` };
  },

  delete_task(args) {
    const id = str(args.id);
    const existing = getState().tasks.find((t) => t.id === id);
    if (!existing) return { error: `No task with id ${id}` };
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
    return { ok: true, deleted: publicTask(existing) };
  },

  add_note(args) {
    const title = str(args.title);
    const content = str(args.content);
    if (!title || !content) return { error: 'title and content are required' };
    const note = { id: newId(), title, content, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, notes: [note, ...s.notes] }));
    return { ok: true, note };
  },

  list_notes() {
    const notes = getState().notes;
    return { count: notes.length, notes };
  },

  delete_note(args) {
    const id = str(args.id);
    const existing = getState().notes.find((n) => n.id === id);
    if (!existing) return { error: `No note with id ${id}` };
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
    return { ok: true, deleted: existing };
  },

  set_reminder(args) {
    const message = str(args.message);
    const time = normalizeDate(args.time);
    if (!message) return { error: 'message is required' };
    if (!time) return { error: 'time must be a valid ISO 8601 date/time' };
    if (new Date(time).getTime() < Date.now() - 60_000) return { error: 'time is in the past' };
    const reminder = { id: newId(), message, time, fired: false, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, reminders: [...s.reminders, reminder].sort((a, b) => a.time.localeCompare(b.time)) }));
    return { ok: true, reminder: { ...reminder, localTime: new Date(time).toLocaleString() } };
  },

  list_reminders() {
    const reminders = getState().reminders.filter((r) => !r.fired);
    return {
      count: reminders.length,
      reminders: reminders.map((r) => ({ id: r.id, message: r.message, time: r.time, localTime: new Date(r.time).toLocaleString() })),
    };
  },

  cancel_reminder(args) {
    const id = str(args.id);
    const existing = getState().reminders.find((r) => r.id === id);
    if (!existing) return { error: `No reminder with id ${id}` };
    setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
    return { ok: true, cancelled: existing };
  },

  get_current_datetime() {
    const now = new Date();
    return {
      iso: now.toISOString(),
      local: now.toString(),
      weekday: now.toLocaleDateString(undefined, { weekday: 'long' }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },

  calculate(args) {
    const expression = str(args.expression);
    if (!expression) return { error: 'expression is required' };
    try {
      return { expression, result: evaluate(expression) };
    } catch (e: any) {
      return { expression, error: e?.message || 'Could not evaluate expression' };
    }
  },
};

export function executeTool(call: FunctionCall): ToolResult {
  const name = call.name ?? '';
  const handler = handlers[name];
  if (!handler) return { error: `Unknown tool ${name}` };
  try {
    return handler(call.args ?? {});
  } catch (e: any) {
    return { error: e?.message || 'Tool failed' };
  }
}
