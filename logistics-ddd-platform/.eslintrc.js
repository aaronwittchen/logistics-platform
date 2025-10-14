module.exports = {
  // Parser for TypeScript files
  parser: '@typescript-eslint/parser',
  
  // Parser options
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: false,
    },
  },
  
  // Plugins
  plugins: [
    '@typescript-eslint',
    '@typescript-eslint/eslint-plugin',
  ],
  
  // Extends (base configurations)
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  
  // Environment settings
  env: {
    node: true,
    es2020: true,
    jest: true, // For test files
  },
  
  // Global variables
  globals: {
    console: 'readonly',
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
    require: 'readonly',
    module: 'readonly',
    exports: 'readonly',
  },
  
  // Rules configuration
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for your style
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for your style
    '@typescript-eslint/no-explicit-any': 'warn', // Warn but don't error
    '@typescript-eslint/no-non-null-assertion': 'warn', // Warn about unsafe assertions
    '@typescript-eslint/prefer-nullish-coalescing': 'error', // Prefer ?? over ||
    '@typescript-eslint/prefer-optional-chain': 'error', // Prefer optional chaining
    
    // Code quality rules
    '@typescript-eslint/no-magic-numbers': ['warn', {
      ignore: [0, 1, -1],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreEnums: true,
    }],
    
    // Import/Export rules
    '@typescript-eslint/no-var-requires': 'off', // Allow require() for dynamic imports
    '@typescript-eslint/no-require-imports': 'off', // Allow require() patterns
    
    // Class and method rules for DDD
    '@typescript-eslint/no-parameter-properties': 'off', // Allow parameter properties in classes
    
    // Error prevention
    'no-console': 'off', // Allow console.log for debugging (you have custom logger)
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Code style
    'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'always-multiline'],
    
    // Best practices
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // Domain-Driven Design specific patterns
    '@typescript-eslint/naming-convention': [
      'error',
      // Enforce PascalCase for classes and interfaces (DDD aggregates, value objects)
      {
        selector: ['class', 'interface', 'typeAlias', 'enum'],
        format: ['PascalCase'],
      },
      // Enforce camelCase for methods and variables
      {
        selector: ['method', 'function', 'parameter', 'variable', 'property'],
        format: ['camelCase'],
      },
      // Allow UPPER_CASE for constants
      {
        selector: ['variable'],
        modifiers: ['const'],
        format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
      },
    ],
    
    // Infrastructure layer rules
    '@typescript-eslint/no-inferrable-types': 'off', // Allow explicit types in infrastructure
  },
  
  // Override rules for specific file patterns
  overrides: [
    // Test files - more lenient rules
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        'max-len': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    
    // Infrastructure layer - allow more flexibility
    {
      files: ['src/**/infrastructure/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-magic-numbers': 'warn',
      },
    },
    
    // Domain layer - strict rules for business logic
    {
      files: ['src/**/domain/**/*.ts'],
      rules: {
        '@typescript-eslint/no-magic-numbers': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '!.eslintrc.js',
  ],
};
