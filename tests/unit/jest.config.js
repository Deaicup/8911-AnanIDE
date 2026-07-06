import { jest } from '@jest/globals';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../../packages', '<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@anan/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.test.ts',
  ],
};
