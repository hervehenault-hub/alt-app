import type { Action, Domain, PlaceCategory } from './content/schemas';

/**
 * Parcours pas à pas (T6.4) : choix déterministe de la prochaine action à proposer.
 * Fonction pure : aucune lecture de l'heure système, `now` est fourni par l'appelant.
 */

/** Réponse de l'utilisateur à une action proposée. */
export type JourneyStatus = 'fait' | 'plus_tard' | 'pas_pour_moi';

export type JourneyEvent = {
  actionId: string;
  status: JourneyStatus;
  /** Date de la réponse (objet Date ou chaîne ISO 8601). */
  at: Date | string;
};

/** Contrainte principale déclarée à l'accueil. */
export type MainConstraint = 'budget' | 'temps' | 'mobilite';

export type JourneyProfile = {
  /** Domaines choisis ; vide ou absent = tous les domaines. */
  domains?: readonly Domain[] | null;
  mainConstraint?: MainConstraint | null;
};

/** Champs d'une action utiles au choix (une `Action` du contenu convient). */
export type JourneyAction = Pick<
  Action,
  'id' | 'domain' | 'effort' | 'kind' | 'saving_eur_per_occurrence' | 'linked_category'
>;

export type NextActionInput<A extends JourneyAction = JourneyAction> = {
  actions: readonly A[];
  history: readonly JourneyEvent[];
  profile: JourneyProfile;
  now: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Délai après lequel une habitude faite ou une action « plus tard » peut revenir. */
export const COME_BACK_AFTER_DAYS = 7;

/**
 * Catégories de lieux considérées « de proximité » pour une personne peu mobile :
 * bornes de collecte et commerces de quartier (paniers anti-gaspi). À ajuster avec le propriétaire.
 */
export const PROXIMITY_CATEGORIES: readonly PlaceCategory[] = ['collecte', 'anti_gaspi'];

function toTime(value: Date | string): number {
  return (typeof value === 'string' ? new Date(value) : value).getTime();
}

/** Dernière réponse connue pour chaque action (la plus récente ; à égalité, la dernière de la liste). */
function latestEvents(
  history: readonly JourneyEvent[],
): Map<string, { status: JourneyStatus; time: number }> {
  const latest = new Map<string, { status: JourneyStatus; time: number }>();
  for (const event of history) {
    const time = toTime(event.at);
    if (Number.isNaN(time)) continue;
    const previous = latest.get(event.actionId);
    if (!previous || time >= previous.time)
      latest.set(event.actionId, { status: event.status, time });
  }
  return latest;
}

function isEligible(
  action: JourneyAction,
  last: { status: JourneyStatus; time: number } | undefined,
  now: number,
): boolean {
  if (!last) return true;
  const cooledDown = now - last.time >= COME_BACK_AFTER_DAYS * DAY_MS;
  switch (last.status) {
    case 'pas_pour_moi':
      return false;
    case 'fait':
      return action.kind === 'habitude' && cooledDown;
    case 'plus_tard':
      return cooledDown;
  }
}

const effortRank = (action: JourneyAction) => (action.effort === 'faible' ? 0 : 1);

const isMobilityFriendly = (action: JourneyAction) =>
  action.linked_category === null || PROXIMITY_CATEGORIES.includes(action.linked_category);

/**
 * Prochaine action à proposer, ou `null` s'il n'y a plus rien.
 *
 * Ordre : critère de la contrainte principale (économie décroissante pour `budget`, effort faible
 * pour `temps`, actions sans lieu ou de proximité pour `mobilite`), puis effort faible avant moyen,
 * puis ordre du catalogue (ce qui rend le résultat déterministe).
 */
export function nextAction<A extends JourneyAction>({
  actions,
  history,
  profile,
  now,
}: NextActionInput<A>): A | null {
  const nowTime = now.getTime();
  const domains = profile.domains && profile.domains.length > 0 ? new Set(profile.domains) : null;
  const latest = latestEvents(history);

  const candidates = actions
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => !domains || domains.has(action.domain))
    .filter(({ action }) => isEligible(action, latest.get(action.id), nowTime));

  const primary = (action: JourneyAction): number => {
    switch (profile.mainConstraint) {
      case 'budget':
        return -Math.max(0, action.saving_eur_per_occurrence);
      case 'temps':
        return effortRank(action);
      case 'mobilite':
        return isMobilityFriendly(action) ? 0 : 1;
      default:
        return 0;
    }
  };

  candidates.sort(
    (a, b) =>
      primary(a.action) - primary(b.action) ||
      effortRank(a.action) - effortRank(b.action) ||
      a.index - b.index,
  );
  return candidates[0]?.action ?? null;
}

/** Rythme choisi pour le parcours. */
export type JourneyRhythm = 'weekly' | 'twice_weekly' | 'self_paced';

/** Intervalle entre deux propositions, en jours (`twice_weekly` : arrondi à 3 jours). */
export const RHYTHM_INTERVAL_DAYS: Record<Exclude<JourneyRhythm, 'self_paced'>, number> = {
  weekly: 7,
  twice_weekly: 3,
};

/**
 * Date de la prochaine proposition à partir de la dernière.
 * Renvoie `null` quand il n'y a pas d'échéance : rythme `self_paced` (à son rythme), ou aucune
 * proposition précédente (`lastDate` null : l'appelant propose tout de suite).
 */
export function nextDueDate(rhythm: JourneyRhythm, lastDate: Date | string | null): Date | null {
  if (rhythm === 'self_paced' || lastDate === null) return null;
  const time = toTime(lastDate);
  if (Number.isNaN(time)) return null;
  return new Date(time + RHYTHM_INTERVAL_DAYS[rhythm] * DAY_MS);
}
