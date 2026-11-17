import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Garde-fou T1.1 : aucune couleur en dur (hexadécimale, rgb(), hsl()) hors de
 * `src/theme/tokens.ts`. Les composants passent par les jetons de `@/theme`.
 */
const SRC = join(__dirname, '..');
// Le présent fichier contient des exemples volontaires pour tester le détecteur.
// Le test de contraste utilise le noir et le blanc purs comme valeurs de référence WCAG.
const ALLOWED = new Set([
  'theme/tokens.ts',
  'theme/tokens.contrast.test.ts',
  '__tests__/no-hex-colors.test.ts',
]);
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('Couleurs', () => {
  it('ne sont définies que dans src/theme/tokens.ts', () => {
    const offenders = listSourceFiles(SRC)
      .map((path) => relative(SRC, path).split('\\').join('/'))
      .filter((file) => !ALLOWED.has(file))
      .flatMap((file) =>
        readFileSync(join(SRC, file), 'utf8')
          .split('\n')
          .map((line, index) => ({ file, line: index + 1, text: line }))
          .filter(({ text }) => COLOR_LITERAL.test(text)),
      )
      .map(({ file, line, text }) => `${file}:${line} → ${text.trim()}`);

    expect(offenders).toEqual([]);
  });

  it('le détecteur repère bien une couleur en dur', () => {
    expect(COLOR_LITERAL.test("color: '#FF6B4A'")).toBe(true);
    expect(COLOR_LITERAL.test("color: 'rgba(0, 0, 0, 0.5)'")).toBe(true);
    expect(COLOR_LITERAL.test('color: colors.text')).toBe(false);
  });
});
