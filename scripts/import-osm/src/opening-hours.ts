import type { OpeningSlot } from './types.ts';

/**
 * Conversion du tag OSM `opening_hours` vers des créneaux hebdomadaires.
 *
 * Formats gérés : `24/7` ; règles séparées par `;` de la forme `<jours> <plages>` où
 * `<jours>` = `Mo`, `Mo-Fr`, `Mo,We,Fr`, `Sa-Mo`… (absent = tous les jours) et
 * `<plages>` = `09:00-12:00,14:00-19:00`, ou `off` / `closed`. Une règle postérieure remplace
 * les précédentes pour les jours qu'elle cite (sémantique OSM). `PH off` est ignoré (jours fériés
 * non modélisés).
 *
 * Tout le reste (jours fériés ouverts, mois, semaines, `Sa[1]`, `sunrise`, `+`, plages après
 * minuit, commentaires…) renvoie `null` : mieux vaut pas d'horaires que des horaires faux.
 */

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
type Weekday = OpeningSlot['weekday'];

const DAY_SPEC = '(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?';
const DAYS_RE = new RegExp(`^${DAY_SPEC}(?:,${DAY_SPEC})*$`);
const TIME_RANGE_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;

function parseDays(spec: string): Weekday[] | null {
  if (!DAYS_RE.test(spec)) return null;
  const days = new Set<Weekday>();
  for (const part of spec.split(',')) {
    const [from, to] = part.split('-') as [(typeof DAYS)[number], (typeof DAYS)[number]?];
    const start = DAYS.indexOf(from);
    const end = to === undefined ? start : DAYS.indexOf(to);
    // Plage qui fait le tour de la semaine (ex. Sa-Mo).
    for (let i = start; ; i = (i + 1) % 7) {
      days.add((i + 1) as Weekday);
      if (i === end) break;
    }
  }
  return [...days];
}

function parseRanges(spec: string): { opens: string; closes: string }[] | null {
  const ranges: { opens: string; closes: string }[] = [];
  for (const part of spec.split(',')) {
    const match = TIME_RANGE_RE.exec(part);
    if (!match) return null;
    const [, oh, om, ch, cm] = match.map(Number) as [number, number, number, number, number];
    const opens = oh * 60 + om;
    const closes = ch * 60 + cm;
    if (oh > 23 || om > 59 || cm > 59 || closes > 24 * 60 || closes <= opens) return null;
    ranges.push({ opens: part.slice(0, 5), closes: part.slice(6, 11) });
  }
  return ranges;
}

export function parseOpeningHours(value: string | null | undefined): OpeningSlot[] | null {
  if (value == null) return null;
  const normalized = value
    .trim()
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
  if (normalized === '') return null;

  const week = new Map<Weekday, { opens: string; closes: string }[]>();
  const allDays = [1, 2, 3, 4, 5, 6, 7] as Weekday[];

  if (normalized === '24/7') {
    for (const day of allDays) week.set(day, [{ opens: '00:00', closes: '24:00' }]);
  } else {
    const rules = normalized
      .split(';')
      .map((rule) => rule.trim())
      .filter((rule) => rule !== '');
    if (rules.length === 0) return null;
    for (const rule of rules) {
      if (/^PH (off|closed)$/.test(rule)) continue;
      const tokens = rule.split(' ');
      if (tokens.length > 2) return null;
      const [first, second] = tokens as [string, string?];
      const days = second === undefined ? allDays : parseDays(first);
      const timeSpec = second ?? first;
      if (!days) return null;
      const ranges = timeSpec === 'off' || timeSpec === 'closed' ? [] : parseRanges(timeSpec);
      if (!ranges) return null;
      for (const day of days) week.set(day, ranges);
    }
  }

  const slots: OpeningSlot[] = [];
  for (const day of allDays) {
    const ranges = [...(week.get(day) ?? [])].sort((a, b) => a.opens.localeCompare(b.opens));
    for (const range of ranges) slots.push({ weekday: day, ...range });
  }
  return slots;
}
