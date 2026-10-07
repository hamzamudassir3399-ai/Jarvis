import type { Content } from '@google/genai';
import { AlertTriangle, PanelRight, Send, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { checkHealth, runAgentTurn } from '../services/agent';
import { newId } from '../lib/store';
import { useReminders } from '../lib/useReminders';
import type { ChatMessage, ToolCallRecord } from '../types';
import { MessageBubble } from './MessageBubble';

const SUGGESTIONS = [
  'Add a task to buy groceries tomorrow at 5pm',
  'What do I have to do today?',
  'Remind me in 20 minutes to stretch',
  'Save a note: gift ideas for Sara — book, headphones',
  'What is 15% of 1,240?',
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: "Hi, I'm **Jarvis**. I can keep track of your tasks, notes and reminders, do quick math, and help plan your day. What's on your mind?",
};

export function ChatPanel({ onTogglePanel }: { onTogglePanel: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [history, setHistory] = useState<Content[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<{ configured: boolean; model: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkHealth().then(setHealth).catch(() => setHealth({ configured: false, model: '' }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useReminders(
    useCallback((r) => {
      setMessages((m) => [...m, { id: newId(), role: 'model', text: `⏰ **Reminder:** ${r.message}` }]);
    }, []),
  );

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setBusy(true);
    const pendingId = newId();
    setMessages((m) => [
      ...m,
      { id: newId(), role: 'user', text: trimmed },
      { id: pendingId, role: 'model', text: '', pending: true, toolCalls: [] },
    ]);

    const onToolCall = (record: ToolCallRecord) =>
      setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, toolCalls: [...(msg.toolCalls ?? []), record] } : msg)));

    try {
      const result = await runAgentTurn(history, trimmed, onToolCall);
      setHistory(result.history);
      setMessages((m) =>
        m.map((msg) => (msg.id === pendingId ? { ...msg, text: result.text, pending: false, toolCalls: result.toolCalls } : msg)),
      );
    } catch (e: any) {
      setMessages((m) =>
        m.map((msg) => (msg.id === pendingId ? { ...msg, text: e?.message || 'Something went wrong.', pending: false, error: true } : msg)),
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([WELCOME]);
    setHistory([]);
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-white">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold">Jarvis</h1>
          <p className="truncate text-xs text-zinc-500">
            {health === null ? 'Connecting…' : health.configured ? `Daily task agent · ${health.model}` : 'Gemini API key missing'}
          </p>
        </div>
        <button onClick={reset} className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" title="New conversation">
          <Trash2 size={16} />
        </button>
        <button onClick={onTogglePanel} className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 lg:hidden" title="Toggle panel">
          <PanelRight size={16} />
        </button>
      </header>

      {health && !health.configured && (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Set <code className="font-mono">GEMINI_API_KEY</code> in <code className="font-mono">.env.local</code> and restart the server to enable the agent.
          </span>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pl-10">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-zinc-800 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-cyan-500/60">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask Jarvis anything… (Enter to send, Shift+Enter for newline)"
            className="max-h-40 flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-cyan-600 p-2 text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
