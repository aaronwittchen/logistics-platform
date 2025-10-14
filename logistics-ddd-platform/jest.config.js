module.exports = {
  // Use Bun's built-in test runner instead of Node.js Jest
  preset: 'bun-jest',
  
  // Test environment - use Bun's runtime
  testEnvironment: 'node',
  
  // Where to find test files
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|ts)',
    '**/*.(test|spec).(js|ts)',
    '**/*.test.(js|ts)',
    '**/*.spec.(js|ts)'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Module name mapping (matches your TypeScript paths)
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/apps/**/start.ts',
  ],
  
  // Coverage thresholds (optional but recommended)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Test timeout (useful for integration tests)
  testTimeout: 10000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Bail out after first test failure in CI
  bail: process.env.CI === 'true',
  
  // Force exit to work with Bun
  forceExit: true,
  
  // Detect open handles (useful for debugging)
  detectOpenHandles: true,
};
