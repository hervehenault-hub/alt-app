import { parseOpeningHours } from '../opening-hours.ts';

describe('parseOpeningHours', () => {
  it('exemple de référence', () => {
    const slots = parseOpeningHours('Mo-Fr 09:00-12:00,14:00-19:00; Sa 10:00-18:00');
    expect(slots).toHaveLength(11);
    expect(slots?.[0]).toEqual({ weekday: 1, opens: '09:00', closes: '12:00' });
    expect(slots?.at(-1)).toEqual({ weekday: 6, opens: '10:00', closes: '18:00' });
  });

  it('listes de jours, plage qui boucle sur la semaine, espaces tolérés', () => {
    expect(parseOpeningHours('Mo,We 10:00-12:00')?.map((s) => s.weekday)).toEqual([1, 3]);
    expect(parseOpeningHours('Sa-Mo 10:00-12:00')?.map((s) => s.weekday)).toEqual([1, 6, 7]);
    expect(parseOpeningHours('Mo - Fr 09:00 - 17:00')).toHaveLength(5);
  });

  it('sans jours : tous les jours ; 24/7 ; fermeture à 24:00', () => {
    expect(parseOpeningHours('08:00-20:00')).toHaveLength(7);
    expect(parseOpeningHours('24/7')?.[6]).toEqual({ weekday: 7, opens: '00:00', closes: '24:00' });
    expect(parseOpeningHours('Fr 18:00-24:00')).toEqual([
      { weekday: 5, opens: '18:00', closes: '24:00' },
    ]);
  });

  it('off / closed et ordre des créneaux', () => {
    expect(parseOpeningHours('Mo-Su 09:00-18:00; Su closed')).toHaveLength(6);
    expect(parseOpeningHours('Mo 14:00-18:00,09:00-12:00')?.map((s) => s.opens)).toEqual([
      '09:00',
      '14:00',
    ]);
  });

  it.each([
    [''],
    ['Sa[1] 10:00-12:00'],
    ['Mo-Fr 22:00-02:00'],
    ['Mo-Fr 09:00+'],
    ['sunrise-sunset'],
    ['Jan-Mar Mo 10:00-12:00'],
    ['PH 10:00-12:00'],
    ['Mo-Fr 9:00-12:00'],
    ['Mo-Fr 09:00-25:00'],
    ['Mo-Fr 09:00-18:00 "sur rendez-vous"'],
  ])('format non géré → null : %s', (value) => {
    expect(parseOpeningHours(value)).toBeNull();
  });

  it('absent → null', () => {
    expect(parseOpeningHours(undefined)).toBeNull();
    expect(parseOpeningHours(null)).toBeNull();
  });
});
