import React, { useEffect, useState } from "react";
import { PAGE_TOURS } from "./pageIntros";
import TourStepCard from "./TourStepCard";
import OtherWaysStepCard from "./OtherWaysStepCard";

// Bumping this replays every page tour once for everyone (existing users
// included), then it goes back to being one-time per page.
const TOUR_VERSION = "v2";
const seenKey = (page) => `tour_seen_${TOUR_VERSION}_${page}`;

// Shows a one-time intro tour the first time the user lands on a page.
export default function PageIntroTour({ currentPageName }) {
  const [steps, setSteps] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setSteps(null);
    const tour = PAGE_TOURS[currentPageName];
    if (!tour) return;
    if (localStorage.getItem(seenKey(currentPageName))) return;
    // On the very first open, the notification permission prompt and the pinned
    // capture prompt come first — let those finish before the tour starts.
    const delay = currentPageName === "Home" ? 14000 : 1200;
    const t = setTimeout(() => {
      setIndex(0);
      setSteps(tour);
    }, delay);
    return () => clearTimeout(t);
  }, [currentPageName]);

  const finish = () => {
    localStorage.setItem(seenKey(currentPageName), "1");
    setSteps(null);
  };

  if (!steps || !steps[index]) return null;
  const isLast = index === steps.length - 1;
  const step = steps[index];
  const next = () => (isLast ? finish() : setIndex((i) => i + 1));

  if (step.variant === "otherWays") {
    return (
      <OtherWaysStepCard
        isLast={isLast}
        stepNumber={index + 1}
        totalSteps={steps.length}
        onNext={next}
        onSkip={finish}
      />
    );
  }

  return (
    <TourStepCard
      step={step}
      isLast={isLast}
      stepNumber={index + 1}
      totalSteps={steps.length}
      onNext={() => (isLast ? finish() : setIndex((i) => i + 1))}
      onSkip={finish}
    />
  );
}