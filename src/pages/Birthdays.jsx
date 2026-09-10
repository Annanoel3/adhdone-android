import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BirthdayList from "../components/birthdays/BirthdayList";
import AddBirthdayForm from "../components/birthdays/AddBirthdayForm";
import { ensureBirthdayReminders } from "../components/utils/birthdayScheduler";

export default function Birthdays() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("adhd_theme") || "minimalist");

  const loadTasks = async () => {
    try {
      const all = await base44.entities.Task.list("-updated_date", 500);
      setTasks(all);
    } catch (e) {
      console.error("Error loading tasks:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setUser(await base44.auth.me());
      } catch (e) {
        console.error("Error loading user:", e);
      }
      await loadTasks();
    })();
    const handler = () => loadTasks();
    window.addEventListener("tasks-changed", handler);
    return () => window.removeEventListener("tasks-changed", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTheme(localStorage.getItem("adhd_theme") || "minimalist");
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const birthdays = useMemo(
    () =>
      tasks
        .filter((t) => (t.birthday_person || t.classification === "birthday") && t.status === "active" && t.next_reminder)
        .sort((a, b) => new Date(a.next_reminder) - new Date(b.next_reminder)),
    [tasks]
  );

  // Make sure every birthday actually has its reminders scheduled
  useEffect(() => {
    if (birthdays.length > 0) ensureBirthdayReminders(birthdays).catch(() => {});
  }, [birthdays.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 md:p-8 w-full" style={{ paddingBottom: "max(8rem, calc(8rem + env(safe-area-inset-bottom)))" }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Birthdays 🎂</h1>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
            Never forget to text your loved ones on their birthday again.
          </p>
        </div>

        {showAdd ? (
          <AddBirthdayForm
            user={user}
            onDone={() => {
              setShowAdd(false);
              loadTasks();
            }}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <Button onClick={() => setShowAdd(true)} className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Add Birthday
          </Button>
        )}

        <BirthdayList birthdays={birthdays} theme={theme} onRefresh={loadTasks} />
      </div>
    </div>
  );
}