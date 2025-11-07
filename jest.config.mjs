/** @type {import('jest').Config} */

const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/**/__tests__/**/*.ts', '<rootDir>/**/*.test.ts'],
  collectCoverageFrom: ['/**/*.{ts,tsx}', '!/**/__tests__/**', '!/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
