// How much of a head start a user actually needs for a task that happens
// somewhere. A blanket "in about an hour, time to head out" is wrong in both
// directions — it's late for a 50-minute drive and it's an hour of pointless
// anxiety for a place 6 minutes away.
//
// Lead = real driving time from the user's home zip to the task's location,
// plus a cushion for the getting-out-the-door part (finding keys, shoes, etc.).

import { getProximity } from './mapsDistance.ts';

const CUSHION_MINUTES = 20;
const MAX_LEAD_MINUTES = 180;

export interface TravelLead {
  leadMinutes: number;   // when to fire the "leave now" reminder
  driveMinutes: number;  // measured drive time, for the message text
}

/**
 * Returns null when we can't measure it (no location, no home zip, no API key,
 * or Google can't resolve the place) — callers then fall back to their default.
 */
export async function getTravelLead(
  location: string,
  homeZip: string,
): Promise<TravelLead | null> {
  const place = (location || '').trim();
  const zip = (homeZip || '').trim();
  if (!place || !zip) return null;

  try {
    const proximity = await getProximity([place], zip);
    const drive = proximity.fromHome[place];
    if (!drive || !drive.minutes) return null;

    const raw = drive.minutes + CUSHION_MINUTES;
    const leadMinutes = Math.min(Math.ceil(raw / 5) * 5, MAX_LEAD_MINUTES);
    return { leadMinutes, driveMinutes: drive.minutes };
  } catch (e) {
    console.error('[travelLead] lookup failed:', e);
    return null;
  }
}