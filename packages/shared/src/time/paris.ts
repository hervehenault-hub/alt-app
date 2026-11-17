/**
 * Heure de Paris sans dépendre d'Intl (dont le support des fuseaux varie selon les moteurs JS mobiles).
 * Règle européenne : heure d'été (UTC+2) du dernier dimanche de mars à 01:00 UTC
 * au dernier dimanche d'octobre à 01:00 UTC ; sinon heure d'hiver (UTC+1).
 */

const HOUR_MS = 60 * 60 * 1000;

/** Instant UTC (ms) du dernier dimanche du mois `month0` (0 = janvier) à 01:00 UTC. */
function lastSundayAt1Utc(year: number, month0: number): number {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0, 1));
  return lastDay.getTime() - lastDay.getUTCDay() * 24 * HOUR_MS;
}

/** Décalage de Paris par rapport à UTC, en heures (1 ou 2), à l'instant donné. */
export function parisUtcOffsetHours(date: Date): 1 | 2 {
  const time = date.getTime();
  const year = date.getUTCFullYear();
  return time >= lastSundayAt1Utc(year, 2) && time < lastSundayAt1Utc(year, 9) ? 2 : 1;
}

export type CalendarDate = { year: number; month: number; day: number };

/** Date du calendrier à Paris (mois de 1 à 12). */
export function parisCalendarDate(date: Date): CalendarDate {
  const shifted = new Date(date.getTime() + parisUtcOffsetHours(date) * HOUR_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}
