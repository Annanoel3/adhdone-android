import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repeat, Timer } from "lucide-react";
import { base44 } from "@/api/base44Client";

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const fmtDuration = (secs) => {
  const m = Math.round(secs / 60);
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

// How often a repeated task shows up, in plain language.
const fmtFrequency = (count, spanDays) => {
  const perWeek = count / Math.max(spanDays / 7, 1);
  if (perWeek >= 6) return 'about daily';
  if (perWeek >= 1.5) return `about ${Math.round(perWeek)}x a week`;
  if (perWeek >= 0.8) return 'about once a week';
  const perMonth = perWeek * 4.3;
  if (perMonth >= 1.5) return `about ${Math.round(perMonth)}x a month`;
  return 'about once a month';
};

// Habits = things you've finished more than once. Duration comes only from
// Sprints / Launchpad sessions, since that's the only time we actually know
// how long something took.
export default function HabitPatterns({ theme }) {
  const [habits, setHabits] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const completed = await base44.entities.Task.filter({ status: 'completed' }, '-completed_at', 2000);
    const logs = await base44.entities.FocusSessionLog.list('-completed_at', 1000);

    const groups = {};
    completed.forEach(t => {
      if (!t.completed_at || t.parent_task_id || t.birthday_person) return;
      const key = norm(t.title);
      if (!key) return;
      const g = groups[key] || (groups[key] = { title: t.title, dates: [] });
      g.dates.push(new Date(t.completed_at).getTime());
    });

    const durations = {};
    logs.forEach(l => {
      const key = norm(l.task_title);
      if (!key || !l.duration_seconds) return;
      (durations[key] = durations[key] || []).push(l.duration_seconds);
    });

    const list = Object.entries(groups)
      .filter(([, g]) => g.dates.length >= 2)
      .map(([key, g]) => {
        const spanDays = (Math.max(...g.dates) - Math.min(...g.dates)) / 86400000;
        const d = durations[key];
        return {
          title: g.title,
          count: g.dates.length,
          frequency: fmtFrequency(g.dates.length, spanDays),
          avgDuration: d ? fmtDuration(d.reduce((a, b) => a + b, 0) / d.length) : null,
          sessions: d ? d.length : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    setHabits(list);
  };

  if (!habits) return null;

  return (
    <Card className="border-none shadow-lg md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Your Habits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.length === 0 && (
          <p className="text-sm text-gray-600">
            Nothing repeated yet. Once you finish the same kind of task a couple of times, it'll show up here — and if you use a Sprint or the Launchpad, we'll learn how long it actually takes you.
          </p>
        )}

        {habits.map((h, i) => (
          <div key={i} className={`p-3 rounded-xl ${theme === 'minimalist' ? 'bg-gray-50' : 'bg-white/60'}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 flex-1 break-words">{h.title}</span>
              <Badge className="bg-blue-100 text-blue-700 flex-shrink-0">{h.count}x done</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">You do this {h.frequency}</p>
            {h.avgDuration ? (
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Usually takes you {h.avgDuration}
                <span className="text-gray-400">({h.sessions} timed {h.sessions === 1 ? 'session' : 'sessions'})</span>
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">Time it with a Sprint or the Launchpad to learn how long this takes you</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}