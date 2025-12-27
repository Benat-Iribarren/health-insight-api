/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  runner: 'groups',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(test|spec).ts', '**/?(*.)+(test|spec).ts'],
  clearMocks: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@user/(.*)$': '<rootDir>/src/user/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  modulePaths: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
};
