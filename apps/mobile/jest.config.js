// eslint-disable-next-line @typescript-eslint/no-require-imports -- fichier de configuration CommonJS
const path = require('node:path');

// lucide-react-native expose de l'ESM (.mjs) à React Native : Jest utilise la version CommonJS.
const lucideCjs = path.dirname(require.resolve('lucide-react-native'));

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react-native/icons/(.*)$': `${lucideCjs}/icons/$1.js`,
    '^lucide-react-native$': `${lucideCjs}/lucide-react-native.js`,
  },
};
