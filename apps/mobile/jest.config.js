/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // lucide-react-native expose de l'ESM (.mjs) à React Native : Jest utilise la version CommonJS.
    '^lucide-react-native$': require.resolve('lucide-react-native'),
  },
};
