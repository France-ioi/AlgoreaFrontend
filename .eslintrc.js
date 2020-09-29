module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@angular-eslint/recommended'
  ],
  plugins: ['rxjs'],
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'alg', style: 'camelCase' },
    ],
    '@angular-eslint/component-selector': [
      'error',
      { type: 'element', prefix: 'alg', style: 'kebab-case' },
    ],
    '@angular-eslint/no-output-native': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { 'argsIgnorePattern': '^_' }
    ],
    '@typescript-eslint/class-literal-property-style': [
      'error',
      'fields',
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/prefer-for-of': ['error'],
    'rxjs/no-async-subscribe': 'error',
    'rxjs/no-ignored-observable': 'error',
    'rxjs/no-nested-subscribe': 'error',
    'rxjs/no-unbound-methods': 'error',
    'rxjs/throw-error': 'error',
    'rxjs/suffix-subjects': [
      'error',
      { suffix: '$' }
    ],
    'semi': ['error'],
    'max-len': [
      'error',
      { 'code': 140 },
    ],
    'no-console': ['error'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-body-style': ['error', 'as-needed'],
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/unbound-method': 'off',
      }
    },
  ],
};
