import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, type Content } from '@google/genai';
import { toolDeclarations } from './shared/toolDeclarations.ts';

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
const MODELS = Array.from(
  new Set([...(process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.split(',') : []), ...DEFAULT_MODELS].map((m) => m.trim()).filter(Boolean)),
);

app.use(express.json({ limit: '5mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    })
  : null;

const SYSTEM_PROMPT = `You are Jarvis, a concise and friendly personal assistant for everyday tasks.
You help the user manage to-dos, notes and reminders, answer questions, do quick calculations and plan their day.

Rules:
- Use the provided tools whenever the user wants to add, list, complete or delete tasks, notes or reminders. Never pretend to have saved something without calling the tool.
- When the user refers to a task/note/reminder by name and you don't know its id, call the list tool first, then act.
- The user's current local date/time is included in each request; use it to resolve relative dates ("tomorrow", "in 2 hours", "next Monday") into ISO 8601 local timestamps for tool arguments.
- After tools run, confirm briefly what you did in plain language. Keep replies short; use markdown lists when listing items.
- Be proactive: if a task seems time-sensitive, offer to set a reminder.`;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(ai), model: preferredModel, models: MODELS });
});

function isRetryable(error: any): boolean {
  const msg = String(error?.message ?? '');
  const code = error?.status ?? error?.code ?? (msg.match(/"code":\s*(\d{3})/)?.[1] && Number(msg.match(/"code":\s*(\d{3})/)![1]));
  return [404, 429, 500, 503].includes(Number(code));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Turns the SDK's raw JSON error string into an HTTP status and a human-readable message. */
function describeGeminiError(error: any): { status: number; message: string } {
  const raw = String(error?.message ?? 'Gemini request failed');
  let status = Number(error?.status ?? error?.code) || 500;
  let message = raw;
  try {
    const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    if (parsed?.error?.code) status = Number(parsed.error.code);
    if (parsed?.error?.message) message = String(parsed.error.message);
  } catch {
    /* not JSON */
  }
  if (status === 429) message = `Gemini quota or rate limit reached. ${message}`;
  if (![400, 401, 403, 404, 429, 500, 503].includes(status)) status = 502;
  return { status, message };
}

/** Tries each configured model in turn (most recently successful first), with one retry, so a 503 "high demand" on one model does not fail the request. */
let preferredModel = MODELS[0];

async function generateWithFallback(client: GoogleGenAI, contents: Content[], systemInstruction: string) {
  let lastError: any;
  const order = [preferredModel, ...MODELS.filter((m) => m !== preferredModel)];
  for (const model of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }],
            temperature: 0.4,
          },
        });
        preferredModel = model;
        return { response, model };
      } catch (error: any) {
        lastError = error;
        if (!isRetryable(error)) throw error;
        console.warn(`Gemini ${model} attempt ${attempt + 1} failed: ${String(error?.message).slice(0, 160)}`);
        if (attempt === 0) await sleep(800);
      }
    }
  }
  throw lastError;
}

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not set. Add it to .env.local and restart the server.',
    });
  }

  const { contents, now } = req.body as { contents?: Content[]; now?: string };
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: 'contents is required' });
  }

  try {
    const { response, model } = await generateWithFallback(
      ai,
      contents,
      `${SYSTEM_PROMPT}\n\nCurrent local date/time: ${now ?? new Date().toString()}`,
    );

    const content = response.candidates?.[0]?.content ?? { role: 'model', parts: [] };
    res.json({
      content,
      text: response.text ?? '',
      functionCalls: response.functionCalls ?? [],
      model,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    const { status, message } = describeGeminiError(error);
    res.status(status).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Jarvis running on http://localhost:${port} (models: ${MODELS.join(' > ')}, key: ${ai ? 'set' : 'MISSING'})`);
  });
}

startServer();
