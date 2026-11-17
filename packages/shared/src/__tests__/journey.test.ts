import actionsJson from '../../../../content/actions.json';
import { actionsFileSchema } from '../content';
import { nextAction, nextDueDate, type JourneyAction, type JourneyEvent } from '../journey';

const action = (overrides: Partial<JourneyAction> & { id: string }): JourneyAction => ({
  domain: 'alimentation',
  effort: 'faible',
  kind: 'ponctuelle',
  saving_eur_per_occurrence: 0,
  linked_category: null,
  ...overrides,
});

const NOW = new Date('2026-11-17T10:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

const catalog: JourneyAction[] = [
  action({ id: 'a-moyen', effort: 'moyen', saving_eur_per_occurrence: 2 }),
  action({ id: 'a-faible', saving_eur_per_occurrence: 1 }),
  action({ id: 'd-faible', domain: 'quotidien_dechets', linked_category: 'collecte' }),
  action({
    id: 'r-cher',
    domain: 'reparation_reemploi',
    effort: 'moyen',
    saving_eur_per_occurrence: 200,
    linked_category: 'reparation',
  }),
  action({
    id: 'r-ressourcerie',
    domain: 'reparation_reemploi',
    saving_eur_per_occurrence: 25,
    linked_category: 'ressourcerie',
  }),
];

const run = (history: JourneyEvent[] = [], profile = {}, actions = catalog) =>
  nextAction({ actions, history, profile, now: NOW })?.id ?? null;

describe('nextAction', () => {
  it('sans profil : effort faible d’abord, puis ordre du catalogue', () => {
    expect(run()).toBe('a-faible');
  });

  it('ne propose que les domaines choisis', () => {
    expect(run([], { domains: ['reparation_reemploi'] })).toBe('r-ressourcerie');
  });

  it('une liste de domaines vide équivaut à tous les domaines', () => {
    expect(run([], { domains: [] })).toBe('a-faible');
  });

  it('budget : privilégie la plus grosse économie', () => {
    expect(run([], { mainConstraint: 'budget' })).toBe('r-cher');
  });

  it('budget : à économie égale, effort faible avant moyen', () => {
    const actions = [
      action({ id: 'moyen', effort: 'moyen', saving_eur_per_occurrence: 5 }),
      action({ id: 'faible', saving_eur_per_occurrence: 5 }),
    ];
    expect(run([], { mainConstraint: 'budget' }, actions)).toBe('faible');
  });

  it('temps : privilégie l’effort faible', () => {
    const actions = [action({ id: 'moyen', effort: 'moyen' }), action({ id: 'faible' })];
    expect(run([], { mainConstraint: 'temps' }, actions)).toBe('faible');
  });

  it('mobilité : privilégie les actions sans lieu ou de proximité', () => {
    const actions = [
      action({ id: 'atelier', linked_category: 'reparation' }),
      action({ id: 'borne', effort: 'moyen', linked_category: 'collecte' }),
    ];
    expect(run([], { mainConstraint: 'mobilite' }, actions)).toBe('borne');
    // Parmi les réparations, aucune n'est sans lieu : l'effort faible départage.
    expect(run([], { mainConstraint: 'mobilite', domains: ['reparation_reemploi'] })).toBe(
      'r-ressourcerie',
    );
  });

  it('mobilité : à égalité, effort faible avant moyen', () => {
    const actions = [
      action({ id: 'sans-lieu-moyen', effort: 'moyen' }),
      action({ id: 'sans-lieu-faible' }),
    ];
    expect(run([], { mainConstraint: 'mobilite' }, actions)).toBe('sans-lieu-faible');
  });

  it('exclut « pas pour moi », même longtemps après', () => {
    expect(run([{ actionId: 'a-faible', status: 'pas_pour_moi', at: daysAgo(400) }])).toBe(
      'd-faible',
    );
  });

  it('exclut une action ponctuelle faite', () => {
    expect(run([{ actionId: 'a-faible', status: 'fait', at: daysAgo(30) }])).toBe('d-faible');
  });

  it('une habitude faite revient après 7 jours, pas avant', () => {
    const actions = [action({ id: 'habitude', kind: 'habitude' }), action({ id: 'autre' })];
    expect(run([{ actionId: 'habitude', status: 'fait', at: daysAgo(6) }], {}, actions)).toBe(
      'autre',
    );
    expect(run([{ actionId: 'habitude', status: 'fait', at: daysAgo(7) }], {}, actions)).toBe(
      'habitude',
    );
  });

  it('« plus tard » revient après 7 jours, pas avant', () => {
    const history = (days: number): JourneyEvent[] => [
      { actionId: 'a-faible', status: 'plus_tard', at: daysAgo(days).toISOString() },
    ];
    expect(run(history(3))).toBe('d-faible');
    expect(run(history(8))).toBe('a-faible');
  });

  it('seule la réponse la plus récente compte', () => {
    const history: JourneyEvent[] = [
      { actionId: 'a-faible', status: 'fait', at: daysAgo(1) },
      { actionId: 'a-faible', status: 'plus_tard', at: daysAgo(20) },
    ];
    expect(run(history)).toBe('d-faible');
  });

  it('renvoie null quand tout est fait ou écarté', () => {
    const history = catalog.map((a) => ({
      actionId: a.id,
      status: 'pas_pour_moi' as const,
      at: daysAgo(1),
    }));
    expect(run(history)).toBeNull();
    expect(run([], {}, [])).toBeNull();
  });

  it('est déterministe et ne modifie pas les entrées', () => {
    const actions = [...catalog];
    const first = run([], { mainConstraint: 'budget' }, actions);
    const reversed = [...catalog].reverse();
    expect(run([], { mainConstraint: 'budget' }, actions)).toBe(first);
    expect(actions).toEqual(catalog);
    // À égalité parfaite, l'ordre du catalogue départage.
    const twins = [action({ id: 'premier' }), action({ id: 'second' })];
    expect(run([], {}, twins)).toBe('premier');
    expect(run([], { mainConstraint: 'budget' }, reversed)).toBe('r-cher');
  });

  it('fonctionne avec le vrai catalogue de contenu', () => {
    const next = nextAction({
      actions: actionsFileSchema.parse(actionsJson).actions,
      history: [],
      profile: { mainConstraint: 'budget' },
      now: NOW,
    });
    expect(next?.id).toBe('reparer-telephone');
  });
});

describe('nextDueDate', () => {
  const last = new Date('2026-11-10T08:00:00Z');

  it('weekly : 7 jours plus tard', () => {
    expect(nextDueDate('weekly', last)?.toISOString()).toBe('2026-11-17T08:00:00.000Z');
  });

  it('twice_weekly : 3 jours plus tard', () => {
    expect(nextDueDate('twice_weekly', last.toISOString())?.toISOString()).toBe(
      '2026-11-13T08:00:00.000Z',
    );
  });

  it('self_paced : aucune échéance', () => {
    expect(nextDueDate('self_paced', last)).toBeNull();
  });

  it('sans date précédente : null (proposition immédiate)', () => {
    expect(nextDueDate('weekly', null)).toBeNull();
  });
});
