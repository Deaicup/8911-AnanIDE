/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  roots: ['<rootDir>/../../packages', '<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@anan/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  collectCoverageFrom: [
    '<rootDir>/../../packages/*/src/**/*.ts',
    '!<rootDir>/../../packages/*/src/**/*.test.ts',
  ],
};
