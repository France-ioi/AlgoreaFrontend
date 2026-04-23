// @ts-check
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const ngrx = require('@ngrx/eslint-plugin');
const rxjsX = require('eslint-plugin-rxjs-x').default;
const jasmine = require('eslint-plugin-jasmine');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = tseslint.config(
  {
    ignores: ['**/node_modules/**', 'dist/**', '.angular/**', 'design/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@angular-eslint': angular,
      '@ngrx': ngrx,
      'rxjs-x': rxjsX,
      jasmine,
      '@stylistic': stylistic,
    },
    rules: {
      ...angular.configs.recommended.rules,
      ...ngrx.configs.all.rules,
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'alg', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'alg', style: 'kebab-case' },
      ],
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/prefer-inject': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/class-literal-property-style': ['error', 'fields'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/prefer-for-of': ['error'],
      'rxjs-x/no-async-subscribe': 'error',
      'rxjs-x/no-floating-observables': 'error',
      'rxjs-x/no-nested-subscribe': 'error',
      'rxjs-x/no-unbound-methods': 'error',
      'rxjs-x/throw-error': 'error',
      'rxjs-x/suffix-subjects': 'off',
      '@stylistic/semi': ['error'],
      'max-len': ['error', { code: 140 }],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'comma', requireLast: true },
        singleline: { delimiter: 'comma', requireLast: false },
        multilineDetection: 'last-member',
      }],
      'no-console': ['error'],
      'arrow-parens': ['error', 'as-needed'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-confusing-arrow': ['error'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'brace-style': ['error', '1tbs'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'always', { objectsInArrays: false }],
      'computed-property-spacing': ['error'],
      'space-in-parens': ['error'],
      'func-call-spacing': ['error'],
      'no-trailing-spaces': ['error'],
      'no-multi-spaces': ['error'],
      'block-spacing': ['error'],
      'key-spacing': ['error'],
      'keyword-spacing': ['error'],
      'no-eq-null': ['error'],
      '@typescript-eslint/explicit-function-return-type': ['error'],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'forbid' },
        { selector: 'variable', format: ['camelCase'] },
        { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'memberLike', modifiers: ['private'], format: ['camelCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'property', format: ['camelCase', 'snake_case'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
      ],
      indent: ['error', 2, { SwitchCase: 1 }],
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowNullableString: true,
        allowNullableNumber: true,
        allowNullableBoolean: true,
      }],
      quotes: ['error', 'single', {
        avoidEscape: true,
        allowTemplateLiterals: false,
      }],
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '**/store/*',
              '!@ngrx/store/testing',
              '!**/utils/store/**',
              '!**/store/effects',
              '!**/store/config',
              '!**/store/notification',
              '!**/store/websocket',
              '!**/store/observation',
              '!**/store/time-offset',
              '!**/store/router',
              '!**/store/navigation',
            ],
            message: 'Only store indexes and effects barrels can be imported',
          },
        ],
      }],
      // Re-throwing the `unknown` caught in RxJS `catchError` is idiomatic, and Angular's
      // `HttpErrorResponse` is the conventional thrown value even though it does not extend `Error`.
      '@typescript-eslint/only-throw-error': ['error', {
        allowThrowingUnknown: true,
        allow: ['HttpErrorResponse'],
      }],
      'jasmine/no-focused-tests': ['error'],
      '@ngrx/prefer-effect-callback-in-block-statement': 'off',
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@ngrx/no-store-subscription': 'off',
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      indent: 'off',
      'array-bracket-spacing': 'off',
    },
  },
);
