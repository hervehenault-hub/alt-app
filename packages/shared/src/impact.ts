import type { Action, Factor } from './content/schemas';
import { isFactorUsable } from './content/schemas';
import { parisCalendarDate } from './time/paris';

/**
 * Impact des actions réalisées (T7.1) : euros économisés, kgCO2e évités, équivalences concrètes,
 * avec la liste des facteurs et sources utilisés (écran « méthode et sources »).
 *
 * Principes :
 * - les cumuls sont calculés sur les valeurs exactes, puis arrondis UNE fois, vers le bas ;
 * - jamais de valeur négative ;
 * - une action sans facteur utilisable (absent, `value` null ou `a_verifier`) compte pour les
 *   euros mais pas pour l'impact ;
 * - les équivalences au statut `a_verifier` sont ignorées.
 */

/** Une action réalisée. */
export type Completion = { actionId: string; at: Date | string };

export type ImpactAction = Pick<Action, 'id' | 'saving_eur_per_occurrence' | 'impact_factor_id'>;

export type ImpactFactors = { factors: readonly Factor[]; equivalences: readonly Factor[] };

export type OccurrenceImpact = {
  actionId: string;
  /** Euros économisés pour une occurrence (arrondi prudent). */
  savingEur: number;
  /** kgCO2e évités pour une occurrence ; `null` si aucun facteur utilisable. */
  impactKgCo2e: number | null;
  /** Facteurs utilisés (vide si aucun). */
  sources: Factor[];
};

export type EquivalenceResult = {
  id: string;
  label: string;
  unit: string;
  /** Nombre d'unités équivalentes (ex. km en voiture), arrondi vers le bas. */
  quantity: number;
  factor: Factor;
};

export type ImpactSummary = {
  /** Nombre d'actions réalisées sur la période. */
  count: number;
  savingEur: number;
  impactKgCo2e: number;
  equivalences: EquivalenceResult[];
  /** Facteurs d'impact et d'équivalence ayant servi aux chiffres de la période. */
  sources: Factor[];
};

export type ImpactReport = {
  /** Impact d'une occurrence, pour chaque action réalisée au moins une fois. */
  perOccurrence: Record<string, OccurrenceImpact>;
  /** Mois civil en cours (Europe/Paris). */
  month: ImpactSummary;
  /** Année civile en cours (Europe/Paris). */
  year: ImpactSummary;
  /** Depuis le début. */
  total: ImpactSummary;
};

export type ComputeImpactInput = {
  completions: readonly Completion[];
  actions: readonly ImpactAction[];
  factors: ImpactFactors;
  now: Date;
};

const EPSILON = 1e-9;

/** Arrondit vers le bas à un multiple de `step` (en neutralisant les erreurs de flottants). */
function floorTo(value: number, step: number): number {
  if (!(value > 0)) return 0;
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + EPSILON));
  return Number((Math.floor(value / step + EPSILON) * step).toFixed(decimals));
}

/** Euros : au dixième sous 10 €, à l'euro au-delà. */
export function roundEurosDown(value: number): number {
  return value < 10 ? floorTo(value, 0.1) : floorTo(value, 1);
}

/** Quantités incertaines (kgCO2e) : 2 chiffres significatifs, vers le bas (47,31 → 47 ; 0,168 → 0,16). */
export function roundSignificantDown(value: number, digits = 2): number {
  if (!(value > 0)) return 0;
  const magnitude = Math.floor(Math.log10(value) + EPSILON);
  return floorTo(value, 10 ** (magnitude - digits + 1));
}

/** Équivalences : nombre entier, puis 2 chiffres significatifs, vers le bas (1 234 → 1 200). */
export function roundEquivalenceDown(value: number): number {
  const whole = floorTo(value, 1);
  return whole < 100 ? whole : roundSignificantDown(whole);
}

function usableFactor(action: ImpactAction, factorsById: Map<string, Factor>) {
  if (action.impact_factor_id === null) return null;
  const factor = factorsById.get(action.impact_factor_id);
  return factor && isFactorUsable(factor) ? factor : null;
}

const positive = (value: number) => (value > 0 ? value : 0);

function summarize(
  occurrences: readonly { action: ImpactAction; factor: (Factor & { value: number }) | null }[],
  equivalences: readonly Factor[],
): ImpactSummary {
  let saving = 0;
  let impact = 0;
  const sources = new Map<string, Factor>();
  for (const { action, factor } of occurrences) {
    saving += positive(action.saving_eur_per_occurrence);
    if (factor) {
      impact += positive(factor.value);
      sources.set(factor.id, factor);
    }
  }
  const impactKgCo2e = roundSignificantDown(impact);
  const equivalenceResults: EquivalenceResult[] = [];
  if (impact > 0) {
    for (const eq of equivalences) {
      if (!isFactorUsable(eq)) continue;
      equivalenceResults.push({
        id: eq.id,
        label: eq.label,
        unit: eq.unit,
        quantity: roundEquivalenceDown(impact / eq.value),
        factor: eq,
      });
      sources.set(eq.id, eq);
    }
  }
  return {
    count: occurrences.length,
    savingEur: roundEurosDown(saving),
    impactKgCo2e,
    equivalences: equivalenceResults,
    sources: [...sources.values()],
  };
}

/** Impact d'une seule occurrence d'une action. */
export function occurrenceImpact(action: ImpactAction, factors: ImpactFactors): OccurrenceImpact {
  const factorsById = new Map(factors.factors.map((f) => [f.id, f]));
  const factor = usableFactor(action, factorsById);
  return {
    actionId: action.id,
    savingEur: roundEurosDown(positive(action.saving_eur_per_occurrence)),
    impactKgCo2e: factor ? roundSignificantDown(positive(factor.value)) : null,
    sources: factor ? [factor] : [],
  };
}

/** Calcule l'impact des actions réalisées (occurrence, mois, année, total). */
export function computeImpact({
  completions,
  actions,
  factors,
  now,
}: ComputeImpactInput): ImpactReport {
  const actionsById = new Map(actions.map((a) => [a.id, a]));
  const factorsById = new Map(factors.factors.map((f) => [f.id, f]));
  const today = parisCalendarDate(now);

  const all: { action: ImpactAction; factor: (Factor & { value: number }) | null }[] = [];
  const year: typeof all = [];
  const month: typeof all = [];
  const perOccurrence: Record<string, OccurrenceImpact> = {};

  for (const completion of completions) {
    const action = actionsById.get(completion.actionId);
    if (!action) continue; // action inconnue (retirée du catalogue) : ignorée
    const at = typeof completion.at === 'string' ? new Date(completion.at) : completion.at;
    if (Number.isNaN(at.getTime())) continue;

    const entry = { action, factor: usableFactor(action, factorsById) };
    all.push(entry);
    const date = parisCalendarDate(at);
    if (date.year === today.year) {
      year.push(entry);
      if (date.month === today.month) month.push(entry);
    }
    perOccurrence[action.id] ??= occurrenceImpact(action, factors);
  }

  return {
    perOccurrence,
    month: summarize(month, factors.equivalences),
    year: summarize(year, factors.equivalences),
    total: summarize(all, factors.equivalences),
  };
}
