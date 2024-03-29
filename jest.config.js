module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
  modulePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/dist/'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
};
