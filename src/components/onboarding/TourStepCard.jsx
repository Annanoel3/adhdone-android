import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// One tour step: dims the screen, optionally rings the element it's talking
// about, and shows the explanation near it.
export default function TourStepCard({ step, isLast, stepNumber, totalSteps, onNext, onSkip }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    setRect(null);
    if (!step.selector) return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 450);
    return () => clearTimeout(t);
  }, [step]);

  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const cardStyle = rect
    ? spaceBelow > 240
      ? { top: rect.bottom + 16 }
      : { bottom: window.innerHeight - rect.top + 16 }
    : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={onSkip} />

      {rect && (
        <div
          className="absolute rounded-2xl ring-4 ring-white pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          }}
        />
      )}

      <div
        className="absolute left-4 right-4 mx-auto max-w-md bg-white rounded-2xl shadow-2xl p-5"
        style={cardStyle}
      >
        <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{step.body}</p>
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