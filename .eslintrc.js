module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@angular-eslint/recommended',
    'plugin:@ngrx/all',
  ],
  plugins: ['rxjs', 'jasmine', 'deprecation', '@stylistic/ts'],
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'alg', style: 'camelCase' },
    ],
    '@angular-eslint/component-selector': [
      'error',
      { type: [ 'element', 'attribute' ], prefix: 'alg', style: 'kebab-case' },
    ],
    '@angular-eslint/no-output-native': 'off',
    '@angular-eslint/prefer-inject': 'off',
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
    'rxjs/suffix-subjects': 'off',
    '@stylistic/ts/semi': ['error'],
    'max-len': [
      'error',
      { 'code': 140 },
    ],
    '@typescript-eslint/member-delimiter-style': ['error', {
      "multiline": { "delimiter": "comma", "requireLast": true },
      "singleline": { "delimiter": "comma", "requireLast": false },
      "multilineDetection": "last-member"
    }],
    'no-console': ['error'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-body-style': ['error', 'as-needed'],
    'no-confusing-arrow': ['error'],
    'arrow-spacing': ['error', { "before": true, "after": true }],
    'brace-style': ['error', '1tbs'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'always', { 'objectsInArrays': false }],
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
      "error",
      { "selector": "default", "format": ["camelCase"], "leadingUnderscore": "forbid" },
      { "selector": "variable", "format": ["camelCase"] },
      { "selector": "variable", "modifiers": ["const"], "format": ["camelCase", "UPPER_CASE"] },
      { "selector": "parameter", "format": ["camelCase"], "leadingUnderscore": "allow" },
      { "selector": "memberLike", "modifiers": ["private"], "format": ["camelCase"] },
      { "selector": "enumMember", "format": ["PascalCase"] },
      { "selector": "typeLike", "format": ["PascalCase"] },
      { "selector": "property", "format": ["camelCase", "snake_case"] },
      { "selector": "import", "format": ["camelCase", "PascalCase"] },
    ],
    'indent': ['error', 2, { "SwitchCase": 1 }],
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowNullableString: true,
      allowNullableNumber: true,
      allowNullableBoolean: true
    }],
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: false
    }],
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: [
            '**/store/*',
            '!@ngrx/store/testing',
            '!**/utils/store/**',
            '!**/store/config',
            '!**/store/notification',
            '!**/store/websocket',
            '!**/store/observation',
            '!**/store/time-offset',
            '!**/store/router',
            '!**/store/navigation'
          ],
          message: 'Only store indexes can be imported'
        },
      ]
    }],
    'jasmine/no-focused-tests': ['error'],
    'deprecation/deprecation': ['off'],
    '@ngrx/prefer-effect-callback-in-block-statement': 'off',
    '@typescript-eslint/unbound-method': ['error', {
      'ignoreStatic': true
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@ngrx/no-store-subscription': 'off'
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'indent': 'off',
        'array-bracket-spacing': 'off',
      }
    },
  ],
};
