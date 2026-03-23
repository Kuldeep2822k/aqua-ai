const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // --- Industry-Standard Rules ---

      // Errors: Catch real bugs
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'error',
      'no-shadow': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Warnings: Best practices
      'no-console': 'warn', // Encourage use of Winston logger
      'no-return-await': 'warn',
      'no-throw-literal': 'error',
      'require-await': 'warn',
      'no-param-reassign': ['warn', { props: false }],
      'prefer-template': 'warn',
      'object-shorthand': ['warn', 'always'],
      'no-duplicate-imports': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'coverage/', 'logs/'],
  },
];
