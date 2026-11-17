import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Garde-fou : les icônes s'importent une par une (`lucide-react-native/icons/<nom>`).
 * Importer des valeurs depuis `lucide-react-native` embarque les ~1 600 icônes
 * (≈ +2 Mo de bundle). Seuls les imports de TYPES y sont permis.
 */
const SRC = join(__dirname, '..');
const VALUE_IMPORT = /^import\s+(?!type\b)[^;]*from\s+'lucide-react-native';/m;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('Imports lucide-react-native', () => {
  it('se font icône par icône', () => {
    const offenders = listSourceFiles(SRC)
      .filter((path) => VALUE_IMPORT.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path));
    expect(offenders).toEqual([]);
  });

  it('le détecteur distingue import de valeur et import de type', () => {
    expect(VALUE_IMPORT.test("import { Leaf } from 'lucide-react-native';")).toBe(true);
    expect(VALUE_IMPORT.test("import type { LucideIcon } from 'lucide-react-native';")).toBe(false);
    expect(VALUE_IMPORT.test("import Leaf from 'lucide-react-native/icons/leaf';")).toBe(false);
  });
});
