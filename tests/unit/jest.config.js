// Jest 单元测试配置
// CommonJS 格式，供 Jest 直接加载
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../../packages', '<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    // @anan/* 别名映射到各包 src
    '^@anan/(.*)$': '<rootDir>/../../packages/$1/src',
    // safety.ts 跨包引用 anan-mcp/lib/... 时，测试环境重定向到 src
    '^(\.\\./)+anan-mcp/lib/(.*)$': '<rootDir>/../../packages/anan-mcp/src/$2',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.test.ts',
    '!packages/*/src/index.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/'],
};
