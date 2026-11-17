import actionsJson from '../../../../content/actions.json';
import factorsJson from '../../../../content/impact-factors.json';
import { actionsFileSchema, impactFactorsFileSchema, type Factor } from '../content';
import {
  computeImpact,
  occurrenceImpact,
  roundEquivalenceDown,
  roundEurosDown,
  roundSignificantDown,
  type Completion,
} from '../impact';
import { parisCalendarDate } from '../time/paris';

const { actions } = actionsFileSchema.parse(actionsJson);
const factors = impactFactorsFileSchema.parse(factorsJson);
const NOW = new Date('2026-11-17T10:00:00Z');

const ids = (list: readonly { id: string }[]) => list.map((f) => f.id).sort();

describe('arrondis prudents', () => {
  it('euros : au dixième sous 10 €, à l’euro au-delà, toujours vers le bas', () => {
    expect(roundEurosDown(9.25)).toBe(9.2);
    expect(roundEurosDown(0.3)).toBe(0.3); // pas de 0,29999…
    expect(roundEurosDown(210.99)).toBe(210);
    expect(roundEurosDown(-4)).toBe(0);
  });

  it('kgCO2e : 2 chiffres significatifs vers le bas', () => {
    expect(roundSignificantDown(79.27)).toBe(79);
    expect(roundSignificantDown(0.168)).toBe(0.16);
    expect(roundSignificantDown(104.17)).toBe(100);
    expect(roundSignificantDown(0)).toBe(0);
  });

  it('équivalences : entier, puis 2 chiffres significatifs au-delà de 100', () => {
    expect(roundEquivalenceDown(10.82)).toBe(10);
    expect(roundEquivalenceDown(0.9)).toBe(0);
    expect(roundEquivalenceDown(569.01)).toBe(560);
  });
});

describe('heure de Paris', () => {
  it('passe au jour suivant en heure d’hiver (UTC+1) et d’été (UTC+2)', () => {
    expect(parisCalendarDate(new Date('2025-12-31T23:30:00Z'))).toEqual({
      year: 2026,
      month: 1,
      day: 1,
    });
    expect(parisCalendarDate(new Date('2026-06-30T22:30:00Z'))).toEqual({
      year: 2026,
      month: 7,
      day: 1,
    });
    expect(parisCalendarDate(new Date('2026-06-30T21:30:00Z')).month).toBe(6);
  });
});

describe('computeImpact (valeurs calculées à la main)', () => {
  const completions: Completion[] = [
    { actionId: 'repas-vegetarien-hebdo', at: '2026-11-03T12:00:00Z' }, // 1,50 € ; 0,61 kg
    { actionId: 'repas-vegetarien-hebdo', at: '2026-11-10T12:00:00Z' }, // 1,50 € ; 0,61 kg
    { actionId: 'panier-anti-gaspi', at: '2026-11-15T18:00:00Z' }, // 6 € ; pas de facteur
    // 31/10 23:30 UTC = 1er novembre 00:30 à Paris → compte pour novembre
    { actionId: 'eau-robinet-carafe', at: '2026-10-31T23:30:00Z' }, // 0,25 € ; 0,32 kg
    { actionId: 'reparer-telephone', at: '2026-06-01T09:00:00Z' }, // 200 € ; 79,27 kg
    // 31/12/2025 23:30 UTC = 1er janvier 2026 à Paris → compte pour 2026
    { actionId: 'gourde-remplie-robinet', at: '2025-12-31T23:30:00Z' }, // 1 € ; 0,16 kg
    { actionId: 'jean-seconde-main', at: new Date('2025-05-01T10:00:00Z') }, // 20 € ; 23,2 kg
    { actionId: 'action-retiree-du-catalogue', at: '2026-11-12T10:00:00Z' }, // ignorée
  ];
  const report = computeImpact({ completions, actions, factors, now: NOW });

  it('mois en cours : 4 actions, 9,25 € → 9,2 €, 1,54 kg → 1,5 kg', () => {
    expect(report.month.count).toBe(4);
    expect(report.month.savingEur).toBe(9.2);
    expect(report.month.impactKgCo2e).toBe(1.5);
    // 1,54 / 0,1423 = 10,82 km ; 1,54 / 0,85 = 1,81 repas ; 1,54 / 4,97 = 0,31 repas
    expect(Object.fromEntries(report.month.equivalences.map((e) => [e.id, e.quantity]))).toEqual({
      'eq-km-voiture-thermique': 10,
      'eq-repas-boeuf': 0,
      'eq-repas-vegetarien': 1,
    });
  });

  it('année en cours : 6 actions, 210,25 € → 210 €, 80,97 kg → 80 kg', () => {
    expect(report.year.count).toBe(6);
    expect(report.year.savingEur).toBe(210);
    expect(report.year.impactKgCo2e).toBe(80);
    // 80,97 / 0,1423 = 569,01 → 560 km ; / 0,85 = 95,26 → 95 ; / 4,97 = 16,29 → 16
    expect(Object.fromEntries(report.year.equivalences.map((e) => [e.id, e.quantity]))).toEqual({
      'eq-km-voiture-thermique': 560,
      'eq-repas-boeuf': 16,
      'eq-repas-vegetarien': 95,
    });
  });

  it('total : 7 actions, 230,25 € → 230 €, 104,17 kg → 100 kg', () => {
    expect(report.total.count).toBe(7);
    expect(report.total.savingEur).toBe(230);
    expect(report.total.impactKgCo2e).toBe(100);
  });

  it('ignore l’équivalence « douche » à vérifier', () => {
    expect(report.total.equivalences.map((e) => e.id)).not.toContain('eq-douche');
  });

  it('liste les facteurs et sources utilisés sur la période', () => {
    expect(ids(report.month.sources)).toEqual([
      'eau-robinet-au-lieu-bouteille-litre',
      'eq-km-voiture-thermique',
      'eq-repas-boeuf',
      'eq-repas-vegetarien',
      'repas-poulet-vers-vegetarien',
    ]);
    expect(report.month.sources.every((s) => s.source_url.startsWith('https://'))).toBe(true);
  });

  it('donne l’impact par occurrence, avec ses sources', () => {
    expect(report.perOccurrence['reparer-telephone']).toMatchObject({
      savingEur: 200,
      impactKgCo2e: 79,
    });
    expect(ids(report.perOccurrence['reparer-telephone']?.sources ?? [])).toEqual([
      'fabrication-smartphone-evitee',
    ]);
    expect(report.perOccurrence['gourde-remplie-robinet']?.impactKgCo2e).toBe(0.16);
    expect(report.perOccurrence['action-retiree-du-catalogue']).toBeUndefined();
  });

  it('une action sans facteur compte pour les euros mais pas pour l’impact', () => {
    expect(report.perOccurrence['panier-anti-gaspi']).toEqual({
      actionId: 'panier-anti-gaspi',
      savingEur: 6,
      impactKgCo2e: null,
      sources: [],
    });
  });
});

describe('cas limites', () => {
  const unverified: Factor = {
    id: 'facteur-douteux',
    label: 'Facteur non vérifié',
    value: 3,
    unit: 'kgCO2e',
    source_name: 'Source',
    source_url: 'https://example.org',
    method: '—',
    uncertainty: '—',
    version: null,
    retrieved_at: null,
    status: 'a_verifier',
  };

  it('un facteur à vérifier est ignoré pour l’impact', () => {
    const action = {
      id: 'x',
      saving_eur_per_occurrence: 2,
      impact_factor_id: 'facteur-douteux',
    };
    const impact = occurrenceImpact(action, { factors: [unverified], equivalences: [] });
    expect(impact).toEqual({ actionId: 'x', savingEur: 2, impactKgCo2e: null, sources: [] });
  });

  it('jamais de valeur négative', () => {
    const report = computeImpact({
      completions: [{ actionId: 'x', at: NOW }],
      actions: [{ id: 'x', saving_eur_per_occurrence: -5, impact_factor_id: 'neg' }],
      factors: {
        factors: [{ ...unverified, id: 'neg', value: -3, status: 'verifie' }],
        equivalences: [],
      },
      now: NOW,
    });
    expect(report.total.savingEur).toBe(0);
    expect(report.total.impactKgCo2e).toBe(0);
    expect(report.perOccurrence['x']?.impactKgCo2e).toBe(0);
  });

  it('sans action réalisée : tout à zéro, aucune équivalence ni source', () => {
    const report = computeImpact({ completions: [], actions, factors, now: NOW });
    expect(report.month).toEqual({
      count: 0,
      savingEur: 0,
      impactKgCo2e: 0,
      equivalences: [],
      sources: [],
    });
  });
});
