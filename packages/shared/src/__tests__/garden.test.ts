import type { Domain } from '../content';
import { gardenState } from '../garden';

const many = (domain: Domain, count: number, at = '2026-01-10T10:00:00Z') =>
  Array.from({ length: count }, () => ({ domain, at }));

describe('gardenState', () => {
  it('stade 0 sans action, avec une phrase bienveillante', () => {
    expect(gardenState({ completions: [] })).toEqual({
      stage: 0,
      flowers: { corail: 0, safran: 0, marine: 0 },
      description: 'Votre jardin attend sa première graine, il poussera à votre rythme.',
    });
  });

  it('stade 1 dès la première action', () => {
    const state = gardenState({ completions: many('alimentation', 1) });
    expect(state.stage).toBe(1);
    expect(state.description).toBe(
      'Une première pousse est sortie de terre. On y voit 1 fleur corail.',
    );
  });

  it('un seul domaine plafonne au stade 2 : la variété fait grandir le jardin', () => {
    expect(gardenState({ completions: many('alimentation', 3) }).stage).toBe(2);
    expect(gardenState({ completions: many('alimentation', 30) }).stage).toBe(2);
  });

  it('stades 3, 4 et 5 avec assez d’actions et de domaines', () => {
    expect(
      gardenState({ completions: [...many('alimentation', 4), ...many('quotidien_dechets', 2)] })
        .stage,
    ).toBe(3);
    expect(
      gardenState({ completions: [...many('alimentation', 8), ...many('quotidien_dechets', 4)] })
        .stage,
    ).toBe(4);
    expect(
      gardenState({
        completions: [
          ...many('alimentation', 10),
          ...many('quotidien_dechets', 9),
          ...many('reparation_reemploi', 1),
        ],
      }).stage,
    ).toBe(5);
  });

  it('compte les fleurs par couleur (corail, safran, marine) et les décrit', () => {
    const state = gardenState({
      completions: [
        ...many('alimentation', 3),
        ...many('quotidien_dechets', 1),
        ...many('reparation_reemploi', 2),
      ],
    });
    expect(state.flowers).toEqual({ corail: 3, safran: 1, marine: 2 });
    expect(state.stage).toBe(3);
    expect(state.description).toBe(
      'Votre jardin se couvre de ses premières fleurs. ' +
        'On y voit 3 fleurs corail, 1 fleur safran et 2 fleurs marine.',
    );
  });

  it('plafonne le nombre de fleurs dessinées par couleur', () => {
    expect(gardenState({ completions: many('reparation_reemploi', 50) }).flowers.marine).toBe(12);
  });

  it('inactivité de 6 mois = même stade (la date n’intervient pas)', () => {
    const completions = [...many('alimentation', 7), ...many('quotidien_dechets', 5)];
    const recent = gardenState({ completions });
    const sixMonthsLater = gardenState({
      completions: completions.map((c) => ({ ...c, at: '2025-07-10T10:00:00Z' })),
    });
    expect(sixMonthsLater).toEqual(recent);
    expect(recent.stage).toBe(4);
  });

  it('ne décroît jamais : un stade déjà atteint est conservé', () => {
    expect(gardenState({ completions: many('alimentation', 1), previousStage: 4 }).stage).toBe(4);
    expect(gardenState({ completions: [], previousStage: 2 }).stage).toBe(2);
  });

  it('ajouter une action ne fait jamais baisser le stade', () => {
    const domains: Domain[] = ['alimentation', 'quotidien_dechets', 'reparation_reemploi'];
    const completions: { domain: Domain }[] = [];
    let previous = 0;
    for (let i = 0; i < 40; i += 1) {
      completions.push({ domain: domains[(i * 7) % 3] ?? 'alimentation' });
      const { stage } = gardenState({ completions });
      expect(stage).toBeGreaterThanOrEqual(previous);
      previous = stage;
    }
    expect(previous).toBe(5);
  });
});
