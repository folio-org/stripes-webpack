// Run via `npm test` (needs NODE_OPTIONS=--experimental-vm-modules for native ESM).
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/webpack/**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],
  coverageDirectory: './artifacts/coverage-jest/',
};
