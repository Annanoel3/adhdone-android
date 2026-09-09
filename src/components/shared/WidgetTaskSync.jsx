import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { pushWidgetTasks } from '../utils/widgetBridge';

// Seeds the home-screen widget once on app open, from anywhere in the app — a
// notification tap or a share can land the user on a screen that never renders
// today's list, and the widget shouldn't sit stale until they visit Home.
// Once Home does render, TodaysTasks keeps it current as tasks change.
export default function WidgetTaskSync() {
  useEffect(() => {
    if (!window.Capacitor?.Plugins?.WidgetBridge) return;
    base44.entities.Task.list('-updated_date', 500)
      .then(pushWidgetTasks)
      .catch(() => {});
  }, []);

  return null;
}