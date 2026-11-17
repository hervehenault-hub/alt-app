// Vérifie que la règle « aucun texte en dur dans le JSX » est toujours active
// sur l'app mobile : un composant contenant du texte en dur DOIT être refusé par ESLint.
import { ESLint } from 'eslint';

const sample = `
import { Text } from 'react-native';
export function Exemple() {
  return <Text accessibilityLabel="Libellé en dur">Texte en dur</Text>;
}
`;

const eslint = new ESLint();
const [result] = await eslint.lintText(sample, {
  filePath: 'apps/mobile/src/app/__verification-i18n__.tsx',
});
const rules = new Set(result.messages.map((m) => m.ruleId));

const expected = ['react/jsx-no-literals', 'no-restricted-syntax'];
const missing = expected.filter((rule) => !rules.has(rule));
if (missing.length > 0) {
  console.error(`✖ La règle anti-texte en dur n'est plus active (manque : ${missing.join(', ')}).`);
  process.exit(1);
}
console.log('✔ Règle anti-texte en dur active sur apps/mobile.');
