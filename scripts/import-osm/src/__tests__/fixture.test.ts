import fixture from '../../fixtures/bordeaux-overpass.json';
import { convertOverpassResponse, UNNAMED_COLLECTION_POINT } from '../convert.ts';
import type { OverpassResponse } from '../types.ts';

const report = convertOverpassResponse(fixture as unknown as OverpassResponse);
const byRef = new Map(report.places.map((p) => [p.source_ref, p]));
const place = (ref: string) => {
  const found = byRef.get(ref);
  if (!found) throw new Error(`lieu absent : ${ref}`);
  return found;
};

describe('fixture Bordeaux (20 éléments)', () => {
  it('contient 20 éléments : 17 lieux retenus, 3 écartés avec leur raison', () => {
    expect(fixture.elements).toHaveLength(20);
    expect(report.places).toHaveLength(17);
    expect(report.skipped).toEqual([
      { source_ref: 'node/1016', reason: 'hors_categorie' },
      { source_ref: 'node/1017', reason: 'sans_nom' },
      { source_ref: 'way/2003', reason: 'sans_coordonnees' },
    ]);
  });

  it('classe chaque lieu dans la bonne catégorie', () => {
    const categories = Object.fromEntries(report.places.map((p) => [p.source_ref, p.category]));
    expect(categories).toEqual({
      'node/1001': 'vrac',
      'node/1002': 'vrac',
      'node/1003': 'vrac',
      'node/1004': 'producteurs',
      'way/2001': 'producteurs',
      'node/1005': 'producteurs',
      'node/1006': 'reparation',
      'node/1007': 'reparation',
      'node/1008': 'reparation',
      'node/1009': 'reparation',
      'node/1010': 'reparation',
      'node/1011': 'reparation',
      'node/1012': 'ressourcerie',
      'node/1013': 'ressourcerie',
      'way/2002': 'ressourcerie',
      'node/1014': 'collecte',
      'node/1015': 'collecte',
    });
    expect(place('way/2002').categories).toEqual(['ressourcerie', 'reparation']);
  });

  it('extrait nom, adresse, coordonnées (nœud et centre de way) et contacts', () => {
    expect(place('node/1001')).toMatchObject({
      name: "L'Épicerie du Bocal",
      latitude: 44.8361,
      longitude: -0.5689,
      address: {
        street: '12 Rue des Faures',
        postcode: '33800',
        city: 'Bordeaux',
        formatted: '12 Rue des Faures, 33800 Bordeaux',
      },
      website: 'https://epicerie-du-bocal.example',
      phone: null,
    });
    expect(place('node/1003').address.formatted).toBe('Place Meynard, Bordeaux');
    expect(place('node/1004').address.formatted).toBe('33300 Bordeaux');
    expect(place('way/2001')).toMatchObject({ latitude: 44.8389, longitude: -0.5655 });
    expect(place('way/2001').address.formatted).toBeNull();
  });

  it('nomme les points de collecte sans nom', () => {
    expect(place('node/1014').name).toBe(UNNAMED_COLLECTION_POINT);
  });

  it('renseigne la source OSM, la référence et la licence ODbL', () => {
    for (const p of report.places) {
      expect(p.source).toBe('osm');
      expect(p.license).toBe('ODbL');
      expect(p.source_ref).toMatch(/^(node|way|relation)\/\d+$/);
      expect(p.attribution).toContain('OpenStreetMap');
    }
  });

  it('convertit les horaires courants', () => {
    expect(place('node/1003').opening_hours).toEqual([
      ...[1, 2, 3, 4, 5].flatMap((weekday) => [
        { weekday, opens: '09:00', closes: '12:00' },
        { weekday, opens: '14:00', closes: '19:00' },
      ]),
      { weekday: 6, opens: '10:00', closes: '18:00' },
    ]);
    expect(place('node/1004').opening_hours).toEqual([
      { weekday: 3, opens: '15:00', closes: '19:00' },
      { weekday: 5, opens: '15:00', closes: '19:00' },
      { weekday: 6, opens: '09:00', closes: '12:30' },
    ]);
    // La règle « We » remplace « Mo-Fr » pour le mercredi.
    expect(place('node/1009').opening_hours?.filter((s) => s.weekday === 3)).toEqual([
      { weekday: 3, opens: '09:30', closes: '12:00' },
    ]);
    // « PH off » ignoré, « Mo off » ferme le lundi.
    expect(place('node/1010').opening_hours).toHaveLength(6);
    expect(place('node/1008').opening_hours?.some((s) => s.weekday === 1)).toBe(false);
    expect(place('node/1014').opening_hours).toHaveLength(7);
  });

  it('renvoie null pour les horaires non gérés, en gardant la valeur brute', () => {
    expect(place('node/1006').opening_hours).toBeNull();
    expect(place('node/1006').opening_hours_raw).toBe('Sa[1] 14:00-17:00');
    expect(place('way/2002').opening_hours).toBeNull();
  });
});
