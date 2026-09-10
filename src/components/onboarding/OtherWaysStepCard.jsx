import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Camera, Bell, LayoutGrid } from "lucide-react";

const WAYS = [
  {
    icon: Share2,
    title: "Share highlighted text",
    body: "Highlight text anywhere — a message, an email, a website — hit Share and pick ADHDone. It becomes a task, idea, or event.",
    example: true,
  },
  {
    icon: Camera,
    title: "Share a screenshot or photo",
    body: "Screenshot anything (an invite, a flyer, a receipt) and share it into the app — it reads it and makes the task for you.",
  },
  {
    icon: Bell,
    title: "The pinned notification",
    body: "If you turned on Quick Capture, just expand the notification and dump a task in without opening the app.",
  },
  {
    icon: LayoutGrid,
    title: "The home screen widget",
    body: "Add a task straight from the widget — and see today's tasks right on your home screen.",
  },
];

// Tour step: the non-obvious ways to get things into the app.
export default function OtherWaysStepCard({ isLast, stepNumber, totalSteps, onNext, onSkip }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900">Other ways to add stuff 📥</h3>
        <p className="text-sm text-gray-700 mt-1">
          You don't have to open the app to get a thought out of your head.
        </p>

        <div className="space-y-4 mt-4">
          {WAYS.map((way) => (
            <div key={way.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <way.icon className="w-4 h-4 text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900">{way.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{way.body}</p>
                {way.example && (
                  <p className="mt-2 text-sm text-gray-800 bg-blue-200/70 rounded px-2 py-1 inline-block">
                    hey, don't forget to grab food on the way home
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-gray-400">
            {totalSteps > 1 ? `${stepNumber} of ${totalSteps}` : ""}
          </span>
          <Button onClick={onNext} className="bg-green-600 hover:bg-green-700">
            {isLast ? "OK! Sounds good" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}