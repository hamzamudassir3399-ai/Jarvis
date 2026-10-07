import type { Content, FunctionCall, Part } from '@google/genai';
import { executeTool } from '../lib/tools';
import type { ToolCallRecord } from '../types';

interface ChatResponse {
  content: Content;
  text: string;
  functionCalls: FunctionCall[];
}

const MAX_TOOL_ROUNDS = 6;

async function callServer(contents: Content[]): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, now: new Date().toString() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as ChatResponse;
}

export interface AgentTurnResult {
  text: string;
  toolCalls: ToolCallRecord[];
  history: Content[];
}

/**
 * Runs one agent turn: sends the conversation to Gemini, executes any tool
 * calls locally, feeds results back, and repeats until the model answers in text.
 */
export async function runAgentTurn(
  history: Content[],
  userMessage: string,
  onToolCall?: (record: ToolCallRecord) => void,
): Promise<AgentTurnResult> {
  const contents: Content[] = [...history, { role: 'user', parts: [{ text: userMessage }] }];
  const toolCalls: ToolCallRecord[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await callServer(contents);
    contents.push(response.content);

    if (!response.functionCalls.length) {
      return { text: response.text || '(no response)', toolCalls, history: contents };
    }

    const responseParts: Part[] = response.functionCalls.map((call) => {
      const result = executeTool(call);
      const record: ToolCallRecord = { name: call.name ?? 'unknown', args: call.args ?? {}, result };
      toolCalls.push(record);
      onToolCall?.(record);
      return { functionResponse: { id: call.id, name: call.name, response: result } };
    });
    contents.push({ role: 'user', parts: responseParts });
  }

  return { text: 'I ran out of steps while working on that. Could you rephrase?', toolCalls, history: contents };
}

export async function checkHealth(): Promise<{ configured: boolean; model: string }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Server unavailable');
  return res.json();
}
