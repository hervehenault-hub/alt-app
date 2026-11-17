import type { Domain } from './content/schemas';
import { DOMAINS } from './content/schemas';

/**
 * Jardin de progression (T9.3). Son état dépend uniquement du nombre cumulé d'actions réalisées et
 * de la variété de leurs domaines : il ne dépend pas de la date, donc l'inactivité ne le fait jamais
 * reculer. Le cumul ne fait que croître ; `previousStage` permet en plus de garantir qu'un stade
 * déjà atteint ne soit jamais perdu (ex. si une action est retirée du catalogue).
 */

export type GardenStage = 0 | 1 | 2 | 3 | 4 | 5;

export type FlowerColor = 'corail' | 'safran' | 'marine';

/** Couleur des fleurs de chaque domaine. */
export const DOMAIN_FLOWER_COLOR: Record<Domain, FlowerColor> = {
  alimentation: 'corail',
  quotidien_dechets: 'safran',
  reparation_reemploi: 'marine',
};

/** Seuils de chaque stade : nombre d'actions et nombre de domaines différents (les deux requis). */
export const GARDEN_THRESHOLDS: readonly {
  stage: GardenStage;
  actions: number;
  domains: number;
}[] = [
  { stage: 0, actions: 0, domains: 0 },
  { stage: 1, actions: 1, domains: 1 },
  { stage: 2, actions: 3, domains: 1 },
  { stage: 3, actions: 6, domains: 2 },
  { stage: 4, actions: 12, domains: 2 },
  { stage: 5, actions: 20, domains: 3 },
];

/** Nombre maximal de fleurs dessinées par couleur (au-delà, le jardin est simplement plein). */
export const MAX_FLOWERS_PER_COLOR = 12;

const STAGE_SENTENCES: Record<GardenStage, string> = {
  0: 'Votre jardin attend sa première graine, il poussera à votre rythme.',
  1: 'Une première pousse est sortie de terre.',
  2: 'De jeunes plants prennent racine dans votre jardin.',
  3: 'Votre jardin se couvre de ses premières fleurs.',
  4: 'Votre jardin fleurit joliment, bravo pour cette belle régularité.',
  5: 'Votre jardin est en pleine floraison, riche et varié.',
};

export type GardenInput = {
  /** Actions réalisées (une entrée par réalisation ; la date éventuelle n'est pas utilisée). */
  completions: readonly { domain: Domain; at?: Date | string }[];
  /** Stade déjà atteint auparavant : le résultat n'est jamais inférieur. */
  previousStage?: GardenStage | null;
};

export type GardenState = {
  stage: GardenStage;
  /** Fleurs par couleur (plafonnées à MAX_FLOWERS_PER_COLOR). */
  flowers: Record<FlowerColor, number>;
  /** Phrase accessible décrivant le jardin (lecteurs d'écran). */
  description: string;
};

function flowerPhrase(count: number, color: FlowerColor): string {
  return `${count} ${count > 1 ? 'fleurs' : 'fleur'} ${color}`;
}

function joinFr(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`;
}

export function gardenState({ completions, previousStage }: GardenInput): GardenState {
  const perDomain: Record<Domain, number> = {
    alimentation: 0,
    quotidien_dechets: 0,
    reparation_reemploi: 0,
  };
  for (const completion of completions) perDomain[completion.domain] += 1;
  const total = completions.length;
  const variety = DOMAINS.filter((d) => perDomain[d] > 0).length;

  let stage: GardenStage = 0;
  for (const threshold of GARDEN_THRESHOLDS) {
    if (total >= threshold.actions && variety >= threshold.domains) stage = threshold.stage;
  }
  if (previousStage != null && previousStage > stage) stage = previousStage;

  const flowers: Record<FlowerColor, number> = { corail: 0, safran: 0, marine: 0 };
  for (const domain of DOMAINS) {
    flowers[DOMAIN_FLOWER_COLOR[domain]] = Math.min(perDomain[domain], MAX_FLOWERS_PER_COLOR);
  }

  const parts = (Object.keys(flowers) as FlowerColor[])
    .filter((color) => flowers[color] > 0)
    .map((color) => flowerPhrase(flowers[color], color));
  const description =
    parts.length > 0
      ? `${STAGE_SENTENCES[stage]} On y voit ${joinFr(parts)}.`
      : STAGE_SENTENCES[stage];

  return { stage, flowers, description };
}
