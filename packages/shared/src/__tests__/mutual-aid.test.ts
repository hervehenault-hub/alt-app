import { detectContactInfo, isHelpPostVisible } from '../mutual-aid';

describe('détection de coordonnées (T8.3)', () => {
  it.each([
    ['Appelez-moi au 06 12 34 56 78', ['phone']],
    ['ou au +33 6 12 34 56 78', ['phone']],
    ['écrivez à lou@exemple.fr', ['email']],
    ['rendez-vous au 12 rue Sainte-Catherine', ['address']],
    ['Je prête une perceuse dans le quartier', []],
    ['3 vélos à réparer, samedi 14 h', []],
  ])('« %s »', (text, expected) => {
    expect(detectContactInfo(text)).toEqual(expected);
  });
});

describe('visibilité des annonces (T8.4)', () => {
  const now = new Date('2026-11-17T12:00:00Z');
  it('masque les annonces expirées, closes ou masquées', () => {
    expect(isHelpPostVisible({ status: 'open', expiresAt: '2026-12-01T00:00:00Z' }, now)).toBe(
      true,
    );
    expect(isHelpPostVisible({ status: 'open', expiresAt: '2026-11-01T00:00:00Z' }, now)).toBe(
      false,
    );
    expect(isHelpPostVisible({ status: 'closed', expiresAt: '2026-12-01T00:00:00Z' }, now)).toBe(
      false,
    );
    expect(isHelpPostVisible({ status: 'hidden', expiresAt: '2026-12-01T00:00:00Z' }, now)).toBe(
      false,
    );
  });
});
