// Pushes today's task list to the native Android home-screen widget through the
// WidgetBridge Capacitor plugin. Native-only: on web the plugin is absent and
// every call here is a no-op.
//
// This is a one-way mirror. The widget is a DISPLAY of what the app already
// decided is on today's plate — nothing in here filters, schedules, or reasons
// about tasks beyond formatting them for a small screen. Today's list is
// computed in exactly one place (isTodayTask), and both the Home screen and the
// widget read from it, so the two can never disagree.

import { isTodayTask, getLocalDateString } from './todayTasks';

// The widget only has room for a handful of rows, and a wall of text is the
// opposite of useful on a home screen.
const MAX_WIDGET_TASKS = 5;

// Skip redundant bridge calls — this fires on every task edit, and re-pushing an
// identical list makes the widget redraw for nothing.
let lastPayloadJson = '';

// A clock time only when the task genuinely has one. Day-only tasks are anchored
// at 9 AM internally, so showing "9:00 AM" would invent a time the user never set.
function displayTimeFor(task) {
  if (task.day_only_task) return '';
  const at = task.event_time || (task.reminder_interval === 'once' ? task.next_reminder : null);
  if (!at) return '';
  return new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function todaysWidgetTasks(tasks) {
  return (tasks || [])
    .filter((t) =>
      t.status === 'active' &&
      !t.parent_task_id &&
      !t.birthday_person &&
      isTodayTask(t)
    )
    .slice(0, MAX_WIDGET_TASKS)
    .map((t) => ({
      title: t.title,
      time: displayTimeFor(t),
      urgency: t.urgency || 'medium',
    }));
}

export async function pushWidgetTasks(tasks) {
  const WidgetBridge = window.Capacitor?.Plugins?.WidgetBridge;
  if (!WidgetBridge) return;

  const payload = {
    generatedFor: getLocalDateString(),
    tasks: todaysWidgetTasks(tasks),
  };

  const json = JSON.stringify(payload);
  if (json === lastPayloadJson) return;
  lastPayloadJson = json;

  try {
    await WidgetBridge.updateTasks(payload);
  } catch (err) {
    // The widget failing to redraw must never break the screen the user is on.
    console.error('Widget update failed:', err);
  }
}