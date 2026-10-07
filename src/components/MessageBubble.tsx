import { Bot, ChevronDown, Wrench } from 'lucide-react';
import { useState } from 'react';
import { renderMarkdown } from '../lib/markdown';
import type { ChatMessage } from '../types';

function ToolCalls({ calls }: { calls: NonNullable<ChatMessage['toolCalls']> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 text-xs">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
        <Wrench size={12} />
        {calls.length} tool call{calls.length > 1 ? 's' : ''}: {calls.map((c) => c.name).join(', ')}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {calls.map((c, i) => (
            <pre key={i} className="overflow-x-auto rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-400">
              {c.name}({JSON.stringify(c.args)}){'\n→ '}{JSON.stringify(c.result)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
          <Bot size={16} />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-cyan-600 text-white'
            : message.error
              ? 'rounded-bl-md border border-rose-500/40 bg-rose-500/10 text-rose-200'
              : 'rounded-bl-md bg-zinc-800 text-zinc-100'
        }`}
      >
        {message.toolCalls && message.toolCalls.length > 0 && <ToolCalls calls={message.toolCalls} />}
        {message.pending ? (
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
          </span>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          renderMarkdown(message.text)
        )}
      </div>
    </div>
  );
}
