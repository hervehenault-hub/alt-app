import { classifyTags } from '../categories.ts';
import { buildOverpassQuery, fetchOverpass, USER_AGENT } from '../overpass.ts';

describe('classifyTags', () => {
  it.each([
    [{ shop: 'zero_waste' }, 'vrac'],
    [{ shop: 'supermarket', bulk_purchase: 'yes' }, 'vrac'],
    [{ shop: 'farm' }, 'producteurs'],
    [{ amenity: 'marketplace' }, 'producteurs'],
    [{ repair_cafe: 'yes' }, 'reparation'],
    [{ craft: 'tailor' }, 'reparation'],
    [{ shop: 'computer', repair: 'only' }, 'reparation'],
    [{ shop: 'bicycle', 'service:bicycle:repair': 'yes' }, 'reparation'],
    [{ shop: 'charity' }, 'ressourcerie'],
    [{ amenity: 'recycling' }, 'collecte'],
  ])('%j → %s', (tags, expected) => {
    expect(classifyTags(tags)[0]).toBe(expected);
  });

  it('ignore les éléments hors sujet, privés ou sans réparation', () => {
    expect(classifyTags({ shop: 'bakery' })).toEqual([]);
    expect(classifyTags({ shop: 'computer', repair: 'no' })).toEqual([]);
    expect(classifyTags({ amenity: 'recycling', access: 'private' })).toEqual([]);
    expect(classifyTags({ bulk_purchase: 'no', shop: 'organic' })).toEqual([]);
    expect(classifyTags(undefined)).toEqual([]);
  });
});

describe('requête Overpass (non exécutée)', () => {
  it('cible la bbox de Bordeaux et renvoie centre + tags', () => {
    const query = buildOverpassQuery();
    expect(query).toContain('[out:json][timeout:90][bbox:44.79,-0.66,44.92,-0.52];');
    expect(query).toContain('nwr["amenity"="recycling"];');
    expect(query.trim().endsWith('out center tags;')).toBe(true);
  });

  it('envoie un User-Agent générique (avec un faux fetch, sans réseau)', async () => {
    const calls: { url: string; headers: Record<string, string>; body: string }[] = [];
    const fakeFetch = async (
      url: string,
      init: { method: string; headers: Record<string, string>; body: string },
    ) => {
      calls.push({ url, headers: init.headers, body: init.body });
      return { ok: true, status: 200, json: async () => ({ elements: [] }) };
    };
    await expect(fetchOverpass('[out:json];', { fetchFn: fakeFetch })).resolves.toEqual({
      elements: [],
    });
    expect(calls[0]?.headers['User-Agent']).toBe(USER_AGENT);
    expect(USER_AGENT).not.toMatch(/@/);
    expect(calls[0]?.body).toBe('data=%5Bout%3Ajson%5D%3B');
  });
});
