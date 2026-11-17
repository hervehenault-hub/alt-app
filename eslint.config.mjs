// Configuration ESLint partagée (flat config) pour tout le monorepo.
import js from '@eslint/js';
import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Props qui affichent ou lisent du texte à l'utilisateur.
const TEXT_PROPS =
  '^(accessibilityLabel|accessibilityHint|aria-label|placeholder|title|label|alt)$';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/expo-env.d.ts',
      'packages/shared/src/database.types.ts',
      'supabase/functions/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.cjs', '**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Règles Expo / React Native, limitées à l'app mobile.
  ...expoConfig.map((config) => ({ ...config, files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'] })),
  {
    files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'apps/mobile/tsconfig.json' } },
    },
  },
  // Aucun texte en dur dans le JSX : toutes les chaînes passent par t() (src/i18n/fr/).
  {
    files: ['apps/mobile/src/**/*.tsx'],
    ignores: ['apps/mobile/src/**/__tests__/**', 'apps/mobile/src/**/*.test.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name=/${TEXT_PROPS}/] > Literal`,
          message: 'Texte en dur interdit : utilisez t() (src/i18n/fr/).',
        },
        {
          selector: `JSXAttribute[name.name=/${TEXT_PROPS}/] > JSXExpressionContainer > :matches(Literal, TemplateLiteral)`,
          message: 'Texte en dur interdit : utilisez t() (src/i18n/fr/).',
        },
      ],
    },
  },
  prettier,
);
