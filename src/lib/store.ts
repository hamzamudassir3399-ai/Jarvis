import { useSyncExternalStore } from 'react';
import type { JarvisState } from '../types';

const STORAGE_KEY = 'jarvis:state:v1';

const emptyState: JarvisState = { tasks: [], notes: [], reminders: [] };

function load(): JarvisState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<JarvisState>;
    return {
      tasks: parsed.tasks ?? [],
      notes: parsed.notes ?? [],
      reminders: parsed.reminders ?? [],
    };
  } catch {
    return emptyState;
  }
}

let state: JarvisState = load();
const listeners = new Set<() => void>();

export function getState(): JarvisState {
  return state;
}

export function setState(updater: (prev: JarvisState) => JarvisState): JarvisState {
  state = updater(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useJarvisState(): JarvisState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}
