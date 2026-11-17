// Configuration ESLint partagée (flat config) pour tout le monorepo.
import js from '@eslint/js';
import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
  prettier,
);
