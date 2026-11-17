import { BORDEAUX_CENTER, resolveLocation } from '../geo/location';
import {
  INITIAL_ONBOARDING_STATE,
  isOnboardingDone,
  needsProfileSync,
  onboardingToProfilePatch,
  parseOnboardingState,
  toggleInterest,
} from '../onboarding';

describe('onboarding', () => {
  it('présélectionne la ville pilote et démarre « en attente »', () => {
    expect(INITIAL_ONBOARDING_STATE.status).toBe('pending');
    expect(INITIAL_ONBOARDING_STATE.answers.citySlug).toBe('bordeaux');
    expect(isOnboardingDone(INITIAL_ONBOARDING_STATE)).toBe(false);
  });

  it('« Passer » compte comme terminé', () => {
    expect(isOnboardingDone({ ...INITIAL_ONBOARDING_STATE, status: 'skipped' })).toBe(true);
  });

  it('tolère un stockage vide ou corrompu', () => {
    expect(parseOnboardingState(null)).toEqual(INITIAL_ONBOARDING_STATE);
    expect(parseOnboardingState('{pas du json')).toEqual(INITIAL_ONBOARDING_STATE);
    expect(parseOnboardingState(JSON.stringify({ status: 'inconnu' }))).toEqual(
      INITIAL_ONBOARDING_STATE,
    );
  });

  it('relit un état enregistré', () => {
    const saved = {
      status: 'completed',
      answers: {
        citySlug: 'bordeaux',
        cityNotCovered: false,
        interests: ['alimentation'],
        mainConstraint: 'budget',
      },
      syncedUserId: null,
    };
    expect(parseOnboardingState(JSON.stringify(saved))).toEqual(saved);
  });

  it('ajoute et retire un domaine en gardant l’ordre canonique', () => {
    expect(toggleInterest(['reparation_reemploi'], 'alimentation')).toEqual([
      'alimentation',
      'reparation_reemploi',
    ]);
    expect(toggleInterest(['alimentation'], 'alimentation')).toEqual([]);
  });

  it('copie seulement les réponses données dans le profil', () => {
    const answers = { ...INITIAL_ONBOARDING_STATE.answers };
    expect(onboardingToProfilePatch(answers)).toEqual({});
    expect(
      onboardingToProfilePatch(
        { ...answers, interests: ['quotidien_dechets'], mainConstraint: 'temps' },
        'city-1',
      ),
    ).toEqual({ interests: ['quotidien_dechets'], main_constraint: 'temps', city_id: 'city-1' });
    expect(onboardingToProfilePatch({ ...answers, cityNotCovered: true }, 'city-1')).toEqual({
      city_id: null,
    });
  });

  it('ne synchronise qu’une fois par compte', () => {
    const done = { ...INITIAL_ONBOARDING_STATE, status: 'completed' as const };
    expect(needsProfileSync(INITIAL_ONBOARDING_STATE, 'u1')).toBe(false);
    expect(needsProfileSync(done, 'u1')).toBe(true);
    expect(needsProfileSync({ ...done, syncedUserId: 'u1' }, 'u1')).toBe(false);
    expect(needsProfileSync({ ...done, syncedUserId: 'u1' }, 'u2')).toBe(true);
  });
});

describe('resolveLocation', () => {
  const device = { latitude: 44.84, longitude: -0.57 };
  const quartier = { center: { latitude: 44.85, longitude: -0.58 } };

  it('accordé : position précise de l’appareil', () => {
    expect(resolveLocation({ permission: 'granted', devicePosition: device })).toMatchObject({
      coordinates: device,
      source: 'device',
    });
  });

  it('approximatif : position de l’appareil marquée « environ »', () => {
    const result = resolveLocation({
      permission: 'granted',
      accuracy: 'approximate',
      devicePosition: device,
    });
    expect(result.source).toBe('device_approximate');
    expect(result.uncertaintyMeters).toBeGreaterThan(1000);
  });

  it('refusé : repli sur le quartier choisi, sinon le centre-ville', () => {
    expect(resolveLocation({ permission: 'denied', neighborhood: quartier })).toMatchObject({
      coordinates: quartier.center,
      source: 'neighborhood',
    });
    expect(resolveLocation({ permission: 'denied' })).toMatchObject({
      coordinates: BORDEAUX_CENTER,
      source: 'city_center',
    });
  });

  it('accordé sans position disponible : repli', () => {
    expect(resolveLocation({ permission: 'granted', devicePosition: null }).source).toBe(
      'city_center',
    );
  });
});
