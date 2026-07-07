// ESLint 配置
// 基于 @typescript-eslint 推荐规则，适配项目 strict TS 配置
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // 与 tsconfig noUnusedLocals/noUnusedParameters 对齐
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // 允许 any 用于过渡（与现有 cfg: any 风格一致）
    '@typescript-eslint/no-explicit-any': 'off',
    // POC 阶段允许 console
    'no-console': 'off',
  },
  ignorePatterns: ['lib/', 'dist/', 'build/', 'node_modules/', 'coverage/', '.theia/'],
};
