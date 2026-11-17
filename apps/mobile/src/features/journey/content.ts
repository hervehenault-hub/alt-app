import {
  actionsFileSchema,
  impactFactorsFileSchema,
  type Action,
  type Factor,
  type ImpactFactors,
} from '@alt/shared';

import actionsFile from '../../../../../content/actions.json';
import factorsFile from '../../../../../content/impact-factors.json';

/**
 * Contenu éditorial embarqué dans l'app (validé au chargement) : catalogue des 30 actions
 * et facteurs d'impact sourcés. La base reçoit le même contenu (scripts/load-content).
 */
export const ACTIONS: readonly Action[] = actionsFileSchema.parse(actionsFile).actions;

const factors = impactFactorsFileSchema.parse(factorsFile);
export const IMPACT_FACTORS: ImpactFactors = {
  factors: factors.factors,
  equivalences: factors.equivalences,
};

export function getAction(id: string): Action | undefined {
  return ACTIONS.find((a) => a.id === id);
}

export function getFactor(id: string | null | undefined): Factor | undefined {
  if (!id) return undefined;
  return [...IMPACT_FACTORS.factors, ...IMPACT_FACTORS.equivalences].find((f) => f.id === id);
}
