module.exports = {
  rootDir: '../..',
  cacheDirectory: '<rootDir>/.jest-cache',
  preset: '<rootDir>/node_modules/jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@ibudget/finance-core$': '<rootDir>/packages/finance-core/src/index.ts',
    '^@ibudget/data-access$': '<rootDir>/packages/data-access/src/index.ts'
  }
};

