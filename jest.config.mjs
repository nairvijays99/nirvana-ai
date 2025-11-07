/** @type {import('jest').Config} */

const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  testMatch: ['<rootDir>/app/**/__tests__/**/*.ts', '<rootDir>/app/**/*.test.ts'],
  collectCoverageFrom: ['app/**/*.{ts,tsx}', '!app/**/__tests__/**', '!app/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
