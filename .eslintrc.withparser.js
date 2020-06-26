/**
 * We are using the .JS version of an ESLint config file here so that we can
 * add lots of comments to better explain and document the setup.
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    "eslint:recommended",
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@angular-eslint/recommended'
  ],
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
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/prefer-for-of": ["error"],
  },
  overrides: [ ],
};
