module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testMatch: ['**/__tests__/**/*.(test|spec).ts', '**/?(*.)+(test|spec).ts'],
    clearMocks: true,
    detectOpenHandles: true,
    testTimeout: 30000,
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: './tsconfig.jest.json'
            }
        ]
    },
    moduleNameMapper: {
        '^@common/(.*)$': '<rootDir>/src/common/$1',
        '^@auth/(.*)$': '<rootDir>/src/auth/$1',
        '^@user/(.*)$': '<rootDir>/src/user/$1',
        '^@src/(.*)$': '<rootDir>/src/$1'
    },
    modulePaths: ['<rootDir>/src'],
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/index.ts',
        '!src/common/infrastructure/database/supabaseTypes.ts',
        '!src/**/domain/interfaces/**',
        '!src/**/domain/models/**'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        },
        './src/**/application/**': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        },
        './src/**/infrastructure/endpoints/**': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        },
        './src/identity/infrastructure/http/**': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};
