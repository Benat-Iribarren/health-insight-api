module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(test|spec).ts', '**/?(*.)+(test|spec).ts'],
  clearMocks: true,
  detectOpenHandles: true,
  testTimeout: 60000,
  maxWorkers: 1,
  forceExit: true,
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
  collectCoverage: false,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
};
