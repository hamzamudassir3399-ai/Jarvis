import { Type, type FunctionDeclaration } from '@google/genai';

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'add_task',
    description: 'Add a new to-do task for the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short title of the task.' },
        dueDate: {
          type: Type.STRING,
          description: 'Optional due date/time in ISO 8601 format (e.g. 2026-10-08T09:00). Resolve relative dates like "tomorrow" using the current date.',
        },
        priority: {
          type: Type.STRING,
          enum: ['low', 'medium', 'high'],
          description: 'Priority of the task. Defaults to medium.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List the user\'s tasks. Use this before completing or deleting a task if you do not know its id.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          enum: ['all', 'pending', 'done'],
          description: 'Which tasks to list. Defaults to pending.',
        },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done (or undo it).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The id of the task.' },
        done: { type: Type.BOOLEAN, description: 'true to mark done, false to reopen. Defaults to true.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The id of the task.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_note',
    description: 'Save a free-form note for the user (ideas, info to remember, lists).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short title for the note.' },
        content: { type: Type.STRING, description: 'The note body.' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_notes',
    description: 'List all saved notes.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'delete_note',
    description: 'Delete a saved note.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The id of the note.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder that will alert the user at a given time while the app is open.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: 'What to remind the user about.' },
        time: {
          type: Type.STRING,
          description: 'When to fire, ISO 8601 local time (e.g. 2026-10-07T15:30). Resolve relative times like "in 20 minutes" using the current date and time.',
        },
      },
      required: ['message', 'time'],
    },
  },
  {
    name: 'list_reminders',
    description: 'List upcoming reminders.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'cancel_reminder',
    description: 'Cancel a reminder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The id of the reminder.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_current_datetime',
    description: 'Get the current local date, time and timezone of the user.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'calculate',
    description: 'Evaluate an arithmetic expression (supports + - * / % ^ parentheses and sqrt, round, abs, min, max, pow).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: 'The expression to evaluate, e.g. "(1200 * 0.15) + 45".' },
      },
      required: ['expression'],
    },
  },
];
