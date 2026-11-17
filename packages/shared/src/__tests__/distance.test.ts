import { distanceInMeters, formatDistance } from '../geo/distance';
import { coordinatesSchema } from '../schemas/geo';

const placeDeLaBourse = { latitude: 44.8412, longitude: -0.5697 };
const gareSaintJean = { latitude: 44.8256, longitude: -0.5562 };

describe('distanceInMeters', () => {
  it('vaut 0 pour un même point', () => {
    expect(distanceInMeters(placeDeLaBourse, placeDeLaBourse)).toBe(0);
  });

  it('calcule ~2 km entre la place de la Bourse et la gare Saint-Jean', () => {
    const d = distanceInMeters(placeDeLaBourse, gareSaintJean);
    expect(d).toBeGreaterThan(1900);
    expect(d).toBeLessThan(2200);
  });

  it('est symétrique', () => {
    expect(distanceInMeters(placeDeLaBourse, gareSaintJean)).toBeCloseTo(
      distanceInMeters(gareSaintJean, placeDeLaBourse),
    );
  });
});

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [344, '340 m'],
    [999, '1000 m'],
    [1000, '1 km'],
    [1234, '1,2 km'],
    [12_560, '12,6 km'],
  ])('%d m → %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });

  it('refuse une distance négative ou non finie', () => {
    expect(() => formatDistance(-1)).toThrow(RangeError);
    expect(() => formatDistance(Number.NaN)).toThrow(RangeError);
  });
});

describe('coordinatesSchema', () => {
  it('refuse une latitude hors bornes', () => {
    expect(coordinatesSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
  });
});
