import type { Action, ActionsFile, Domain, ImpactFactorsFile } from './schemas';
import { DOMAINS } from './schemas';

/** Mots interdits (insensible à la casse) dans les textes des actions — voir content/README.md. */
export const FORBIDDEN_WORDS = [
  'échec',
  'vous devez',
  'il faut',
  'mauvais',
  'coupable',
  'empreinte à réduire',
  'pollu',
] as const;

export type ContentIssue = { actionId?: string; message: string };

/** Vérifie que chaque `impact_factor_id` des actions existe dans `factors[]`. */
export function findMissingFactorIds(
  actions: ActionsFile,
  factors: ImpactFactorsFile,
): ContentIssue[] {
  const known = new Set(factors.factors.map((f) => f.id));
  return actions.actions
    .filter((a) => a.impact_factor_id !== null && !known.has(a.impact_factor_id))
    .map((a) => ({
      actionId: a.id,
      message: `facteur d'impact inconnu : ${a.impact_factor_id ?? ''}`,
    }));
}

/**
 * Contraintes éditoriales : 10 actions par domaine dont au moins 6 à effort faible,
 * et aucun mot interdit dans les textes.
 */
export function checkEditorialRules(actions: readonly Action[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const domain of DOMAINS) {
    const inDomain = actions.filter((a) => a.domain === domain);
    if (inDomain.length !== 10) {
      issues.push({ message: `${domain} : ${inDomain.length} actions au lieu de 10` });
    }
    const easy = inDomain.filter((a) => a.effort === 'faible').length;
    if (easy < 6) {
      issues.push({ message: `${domain} : ${easy} actions à effort faible (6 minimum)` });
    }
  }
  for (const action of actions) {
    const text = `${action.title} ${action.body} ${action.saving_basis}`.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      if (text.includes(word)) {
        issues.push({ actionId: action.id, message: `mot interdit : « ${word} »` });
      }
    }
  }
  return issues;
}

/** Nombre d'actions par domaine (utile aux écrans et aux tests). */
export function countByDomain(actions: readonly Action[]): Record<Domain, number> {
  const counts = { alimentation: 0, quotidien_dechets: 0, reparation_reemploi: 0 };
  for (const a of actions) counts[a.domain] += 1;
  return counts;
}
