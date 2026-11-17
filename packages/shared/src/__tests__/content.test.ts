import actionsJson from '../../../../content/actions.json';
import factorsJson from '../../../../content/impact-factors.json';
import {
  actionSchema,
  actionsFileSchema,
  checkEditorialRules,
  factorSchema,
  findMissingFactorIds,
  impactFactorsFileSchema,
  isFactorUsable,
} from '../content';

describe('fichiers de contenu réels', () => {
  const actions = actionsFileSchema.safeParse(actionsJson);
  const factors = impactFactorsFileSchema.safeParse(factorsJson);

  it('content/actions.json respecte le schéma', () => {
    expect(actions.error?.issues ?? []).toEqual([]);
    expect(actions.data?.actions).toHaveLength(30);
  });

  it('content/impact-factors.json respecte le schéma', () => {
    expect(factors.error?.issues ?? []).toEqual([]);
  });

  it('chaque impact_factor_id existe dans factors[]', () => {
    if (!actions.success || !factors.success) throw new Error('fichiers invalides');
    expect(findMissingFactorIds(actions.data, factors.data)).toEqual([]);
  });

  it('respecte les contraintes éditoriales (10 par domaine, ≥ 6 faciles, mots interdits)', () => {
    if (!actions.success) throw new Error('fichier invalide');
    expect(checkEditorialRules(actions.data.actions)).toEqual([]);
  });
});

const validAction = {
  id: 'une-action',
  domain: 'alimentation',
  title: 'Titre',
  body: 'Texte.',
  effort: 'faible',
  kind: 'ponctuelle',
  saving_eur_per_occurrence: 1,
  saving_basis: 'Hypothèse.',
  impact_factor_id: null,
  linked_category: 'vrac',
};

const validFactor = {
  id: 'un-facteur',
  label: 'Libellé',
  value: 1.2,
  unit: 'kgCO2e',
  source_name: 'ADEME',
  source_url: 'https://example.org/source',
  method: 'Méthode.',
  uncertainty: 'Faible.',
  version: null,
  retrieved_at: '2026-11-17',
  status: 'verifie',
};

describe('schémas de contenu', () => {
  it('refuse un champ supplémentaire, un slug invalide ou une économie négative', () => {
    expect(actionSchema.safeParse(validAction).success).toBe(true);
    expect(actionSchema.safeParse({ ...validAction, extra: 1 }).success).toBe(false);
    expect(actionSchema.safeParse({ ...validAction, id: 'Pas_Un_Slug' }).success).toBe(false);
    expect(actionSchema.safeParse({ ...validAction, saving_eur_per_occurrence: -1 }).success).toBe(
      false,
    );
    expect(actionSchema.safeParse({ ...validAction, linked_category: 'cafe' }).success).toBe(false);
  });

  it('refuse les identifiants d’action en double', () => {
    const file = { status: 'a_valider', schema_version: 1, actions: [validAction, validAction] };
    expect(actionsFileSchema.safeParse(file).success).toBe(false);
  });

  it('n’accepte value null que pour un facteur à vérifier', () => {
    expect(factorSchema.safeParse({ ...validFactor, value: null }).success).toBe(false);
    expect(
      factorSchema.safeParse({ ...validFactor, value: null, status: 'a_verifier' }).success,
    ).toBe(true);
    expect(factorSchema.safeParse({ ...validFactor, source_url: 'http://x.org' }).success).toBe(
      false,
    );
  });

  it('impose le préfixe eq- aux équivalences', () => {
    const file = {
      status: 'a_valider',
      schema_version: 1,
      notes: '',
      factors: [],
      equivalences: [validFactor],
    };
    expect(impactFactorsFileSchema.safeParse(file).success).toBe(false);
  });

  it('isFactorUsable écarte les facteurs à vérifier', () => {
    const parsed = factorSchema.parse(validFactor);
    expect(isFactorUsable(parsed)).toBe(true);
    expect(isFactorUsable({ ...parsed, status: 'a_verifier' })).toBe(false);
  });

  it('signale un facteur inconnu', () => {
    const actions = actionsFileSchema.parse({
      status: 'a_valider',
      schema_version: 1,
      actions: [{ ...validAction, impact_factor_id: 'inconnu' }],
    });
    const factors = impactFactorsFileSchema.parse({
      status: 'a_valider',
      schema_version: 1,
      notes: '',
      factors: [],
      equivalences: [],
    });
    expect(findMissingFactorIds(actions, factors)).toEqual([
      { actionId: 'une-action', message: "facteur d'impact inconnu : inconnu" },
    ]);
  });
});
