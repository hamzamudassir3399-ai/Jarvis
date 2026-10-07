# Jarvis — Daily Task Agent

A Gemini-powered personal assistant for everyday tasks. Chat with Jarvis to manage your to-dos, notes and reminders, do quick calculations and plan your day. The agent uses Gemini function calling: the model decides which tool to use, the browser executes it and stores the data locally, and Jarvis confirms what it did.

## Features

- **Tasks** — add, list, complete and delete to-dos with priority and due dates ("add a task to call mom tomorrow at 6pm")
- **Reminders** — time-based alerts that fire in the app (and as browser notifications) while it is open
- **Notes** — save and recall free-form notes
- **Utilities** — current date/time and a safe arithmetic calculator
- Live sidebar showing tasks, reminders and notes; everything is persisted in `localStorage`

## Stack

- React 19 + Vite + Tailwind CSS 4 (client)
- Express + `@google/genai` (server, keeps your API key off the client)
- Model: `gemini-2.5-flash` by default (override with `GEMINI_MODEL`)

## Run locally

**Prerequisites:** Node.js 20+

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey)
3. `npm run dev` and open http://localhost:3000

Other scripts: `npm run lint` (typecheck), `npm run build`, `npm start` (serve the production build).

## How it works

```
Browser                          Server (server.ts)                 Gemini
  │  POST /api/chat {contents}  ──▶  generateContent(tools)   ──▶
  │  ◀── {content, functionCalls}
  │  executes tools locally (src/lib/tools.ts), appends functionResponse
  │  POST /api/chat again … until the model replies with text
```

Tool declarations live in `shared/toolDeclarations.ts` and are used by both the server (sent to Gemini) and the client (executed in `src/lib/tools.ts`).
