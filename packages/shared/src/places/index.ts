/**
 * Lieux (lot 4) : types communs à l'app, conversion des réponses SQL (`search_places`,
 * `get_place`) et recherche locale équivalente (mode démo, sans serveur).
 */
import type { PlaceCategory } from '../content/schemas';
import { distanceInMeters } from '../geo/distance';
import type { Coordinates } from '../schemas/geo';
import { parisUtcOffsetHours } from '../time/paris';

export type PlaceStatus = 'community' | 'multi_confirmed' | 'merchant_confirmed';
export type PlaceSort = 'distance' | 'saving';

export interface OpeningSlot {
  /** 1 = lundi … 7 = dimanche (ISO). */
  weekday: number;
  /** « HH:MM » */
  opens: string;
  /** « HH:MM » ; « 24:00 » ou une heure ≤ ouverture = après minuit. */
  closes: string;
}

export interface PlaceSummary {
  id: string;
  name: string;
  categoryId: PlaceCategory;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceM: number | null;
  isOpen: boolean | null;
  isFree: boolean;
  walkAccessible: boolean;
  transitAccessible: boolean;
  priceHint: string | null;
  estimatedSavingEur: number | null;
  status: PlaceStatus;
  needsRecheck: boolean;
  lastVerifiedAt: string;
}

export interface PlaceDetail extends Omit<PlaceSummary, 'distanceM'> {
  categoryLabel: string;
  domainId: string;
  savingBasis: string | null;
  source: string;
  license: string | null;
  openingHours: OpeningSlot[];
  /** Courte description (données de démonstration). */
  description?: string | null;
}

export interface PlaceSearchParams {
  q?: string | null;
  origin?: Coordinates | null;
  radiusM?: number;
  categoryIds?: readonly PlaceCategory[] | null;
  openNow?: boolean;
  freeOnly?: boolean;
  walkOnly?: boolean;
  transitOnly?: boolean;
  sortBy?: PlaceSort;
  pageSize?: number;
  pageOffset?: number;
}

export interface PlaceSearchPage {
  items: PlaceSummary[];
  total: number;
}

export const SEARCH_RADIUS_OPTIONS_M = [500, 1000, 2000, 5000] as const;
export const DEFAULT_RADIUS_M = 5000;
export const DEFAULT_PAGE_SIZE = 20;

/* ------------------------------------------------------------------------------------------ */
/* Conversion des réponses SQL                                                                */
/* ------------------------------------------------------------------------------------------ */

export interface SearchPlacesRow {
  id: string;
  name: string;
  category_id: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_m: number | null;
  is_open: boolean | null;
  is_free: boolean;
  walk_accessible: boolean;
  transit_accessible: boolean;
  price_hint: string | null;
  estimated_saving_eur: number | string | null;
  status: PlaceStatus;
  needs_recheck: boolean;
  last_verified_at: string;
  total_count: number | string;
}

const num = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

export function mapSearchRows(rows: readonly SearchPlacesRow[]): PlaceSearchPage {
  return {
    total: rows.length > 0 ? Number(rows[0]?.total_count ?? 0) : 0,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      categoryId: r.category_id as PlaceCategory,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      distanceM: num(r.distance_m),
      isOpen: r.is_open,
      isFree: r.is_free,
      walkAccessible: r.walk_accessible,
      transitAccessible: r.transit_accessible,
      priceHint: r.price_hint,
      estimatedSavingEur: num(r.estimated_saving_eur),
      status: r.status,
      needsRecheck: r.needs_recheck,
      lastVerifiedAt: r.last_verified_at,
    })),
  };
}

/** Convertit le JSON renvoyé par `get_place` (ou `null`). */
export function mapPlaceJson(json: unknown): PlaceDetail | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  const hours = Array.isArray(j.opening_hours) ? (j.opening_hours as OpeningSlot[]) : [];
  return {
    id: String(j.id),
    name: String(j.name),
    categoryId: j.category_id as PlaceCategory,
    categoryLabel: String(j.category_label ?? ''),
    domainId: String(j.domain_id ?? ''),
    address: (j.address as string | null) ?? null,
    latitude: Number(j.latitude),
    longitude: Number(j.longitude),
    isOpen: (j.is_open as boolean | null) ?? null,
    isFree: Boolean(j.is_free),
    walkAccessible: Boolean(j.walk_accessible),
    transitAccessible: Boolean(j.transit_accessible),
    priceHint: (j.price_hint as string | null) ?? null,
    estimatedSavingEur: num(j.estimated_saving_eur as number | string | null),
    savingBasis: (j.saving_basis as string | null) ?? null,
    status: j.status as PlaceStatus,
    needsRecheck: Boolean(j.needs_recheck),
    lastVerifiedAt: String(j.last_verified_at),
    source: String(j.source ?? ''),
    license: (j.license as string | null) ?? null,
    openingHours: hours.map((h) => ({ weekday: h.weekday, opens: h.opens, closes: h.closes })),
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Horaires                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const minutes = (hhmm: string): number => {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

/** Jour ISO (1-7) et minute de la journée à Paris. */
export function parisWeekdayAndMinute(date: Date): { weekday: number; minute: number } {
  const local = new Date(date.getTime() + parisUtcOffsetHours(date) * 3_600_000);
  const day = local.getUTCDay();
  return { weekday: day === 0 ? 7 : day, minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

/** Même règle que `is_open_now` en base : `null` sans horaires, créneaux après minuit gérés. */
export function isOpenAt(hours: readonly OpeningSlot[], date: Date): boolean | null {
  if (hours.length === 0) return null;
  const { weekday, minute } = parisWeekdayAndMinute(date);
  const previous = weekday === 1 ? 7 : weekday - 1;
  return hours.some((slot) => {
    const opens = minutes(slot.opens);
    const closes = minutes(slot.closes);
    const overnight = closes <= opens && closes !== 24 * 60;
    if (slot.weekday === weekday) {
      return overnight ? minute >= opens : minute >= opens && minute < (closes || 24 * 60);
    }
    return overnight && slot.weekday === previous && minute < closes;
  });
}

/** Créneaux d'un jour, triés. */
export function slotsForDay(hours: readonly OpeningSlot[], weekday: number): OpeningSlot[] {
  return hours
    .filter((h) => h.weekday === weekday)
    .sort((a, b) => minutes(a.opens) - minutes(b.opens));
}

/* ------------------------------------------------------------------------------------------ */
/* Recherche texte locale (mêmes principes que search_places)                                 */
/* ------------------------------------------------------------------------------------------ */

/** Minuscules, sans accents, ponctuation → espace (comme `normalize_search_text`). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/[-'’_/.,;:!?()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(word: string): Set<string> {
  const padded = `  ${word} `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i += 1) set.add(padded.slice(i, i + 3));
  return set;
}

function similarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  let common = 0;
  ta.forEach((t) => tb.has(t) && (common += 1));
  return common / (ta.size + tb.size - common || 1);
}

/** Proche de `word_similarity` : chaque mot de la requête comparé au mot le plus proche. */
export function wordSimilarity(query: string, text: string): number {
  const qWords = normalizeSearchText(query).split(' ').filter(Boolean);
  const tWords = normalizeSearchText(text).split(' ').filter(Boolean);
  if (qWords.length === 0 || tWords.length === 0) return 0;
  const joined = tWords.join(' ');
  if (joined.includes(qWords.join(' '))) return 1;
  const scores = qWords.map((q) =>
    Math.max(...tWords.map((t) => (t.startsWith(q) && q.length >= 3 ? 0.9 : similarity(q, t)))),
  );
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export interface NeedDefinition {
  id: string;
  label: string;
  synonyms: readonly string[];
  categories: readonly PlaceCategory[];
}

export interface NeedSuggestion {
  id: string;
  label: string;
  categories: readonly PlaceCategory[];
  score: number;
}

/** Besoins les plus proches de la saisie (au plus `max`). */
export function suggestNeeds(
  needs: readonly NeedDefinition[],
  query: string,
  max = 3,
): NeedSuggestion[] {
  const norm = normalizeSearchText(query);
  if (norm.length < 2) return [];
  return needs
    .map((need) => ({
      id: need.id,
      label: need.label,
      categories: need.categories,
      score: Math.max(
        wordSimilarity(norm, need.label),
        ...need.synonyms.map((s) => wordSimilarity(norm, s)),
      ),
    }))
    .filter((n) => n.score >= 0.6)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'fr'))
    .slice(0, max);
}

export interface LocalPlace extends PlaceDetail {
  published?: boolean;
}

export interface LocalSearchContext {
  needs: readonly NeedDefinition[];
  categoryLabels: Readonly<Record<PlaceCategory, string>>;
  now?: Date;
}

/** Recherche hors ligne (mode démo) : mêmes filtres, tri et rétrogradation que la base. */
export function searchPlacesLocal(
  places: readonly LocalPlace[],
  params: PlaceSearchParams,
  { needs, categoryLabels, now = new Date() }: LocalSearchContext,
): PlaceSearchPage {
  const norm = normalizeSearchText(params.q ?? '');
  const radius = params.radiusM ?? DEFAULT_RADIUS_M;
  const categoryHit =
    norm !== '' &&
    Object.entries(categoryLabels).some(
      ([id, label]) => wordSimilarity(norm, `${label} ${id.replace(/_/g, ' ')}`) >= 0.8,
    );
  const needCategories = new Set<PlaceCategory>();
  if (norm !== '' && !categoryHit) {
    suggestNeeds(needs, norm, 5).forEach((n) => n.categories.forEach((c) => needCategories.add(c)));
  }

  const scored = places
    .filter((p) => p.published !== false)
    .map((p) => {
      const distanceM = params.origin ? distanceInMeters(params.origin, p) : null;
      const relevance =
        norm === ''
          ? 1
          : Math.max(
              wordSimilarity(norm, p.name),
              wordSimilarity(
                norm,
                `${categoryLabels[p.categoryId]} ${p.categoryId.replace(/_/g, ' ')}`,
              ),
              needCategories.has(p.categoryId) ? 0.6 : 0,
            );
      return { p, distanceM, relevance, isOpen: isOpenAt(p.openingHours, now) };
    })
    .filter(
      ({ p, distanceM, relevance, isOpen }) =>
        relevance >= 0.5 &&
        (distanceM === null || distanceM <= radius) &&
        (!params.categoryIds?.length || params.categoryIds.includes(p.categoryId)) &&
        (!params.freeOnly || p.isFree) &&
        (!params.walkOnly || p.walkAccessible) &&
        (!params.transitOnly || p.transitAccessible) &&
        (!params.openNow || isOpen === true),
    )
    .sort((a, b) => {
      if (a.p.needsRecheck !== b.p.needsRecheck) return a.p.needsRecheck ? 1 : -1;
      if (params.sortBy === 'saving') {
        const sa = a.p.estimatedSavingEur;
        const sb = b.p.estimatedSavingEur;
        if (sa !== sb) {
          if (sa === null) return 1;
          if (sb === null) return -1;
          return sb - sa;
        }
      }
      if (a.distanceM !== b.distanceM) {
        if (a.distanceM === null) return 1;
        if (b.distanceM === null) return -1;
        return a.distanceM - b.distanceM;
      }
      return b.relevance - a.relevance || a.p.name.localeCompare(b.p.name, 'fr');
    });

  const offset = params.pageOffset ?? 0;
  const size = params.pageSize ?? DEFAULT_PAGE_SIZE;
  return {
    total: scored.length,
    items: scored.slice(offset, offset + size).map(({ p, distanceM, isOpen }) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      distanceM,
      isOpen,
      isFree: p.isFree,
      walkAccessible: p.walkAccessible,
      transitAccessible: p.transitAccessible,
      priceHint: p.priceHint,
      estimatedSavingEur: p.estimatedSavingEur,
      status: p.status,
      needsRecheck: p.needsRecheck,
      lastVerifiedAt: p.lastVerifiedAt,
    })),
  };
}
