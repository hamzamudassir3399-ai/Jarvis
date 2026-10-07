import { useEffect } from 'react';
import { setState, useJarvisState } from './store';
import type { Reminder } from '../types';

export function useReminders(onFire: (reminder: Reminder) => void) {
  const { reminders } = useJarvisState();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = reminders.filter((r) => !r.fired && new Date(r.time).getTime() <= now);
      if (!due.length) return;
      setState((s) => ({
        ...s,
        reminders: s.reminders.map((r) => (due.some((d) => d.id === r.id) ? { ...r, fired: true } : r)),
      }));
      due.forEach((r) => {
        onFire(r);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Jarvis reminder', { body: r.message });
        }
      });
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [reminders, onFire]);
}
