/**
 * We are using the .JS version of an ESLint config file here so that we can
 * add lots of comments to better explain and document the setup.
 */
module.exports = {
  /**
   * See packages/eslint-plugin/src/configs/README.md
   * for what this recommended config contains.
   */
  extends: ['plugin:@angular-eslint/recommended'],
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'app', style: 'camelCase' },
    ],
    '@angular-eslint/component-selector': [
      'error',
      { type: 'element', prefix: 'app', style: 'kebab-case' },
    ],
    "@angular-eslint/no-output-native": "off"
  },
  overrides: [
    /**
     * This extra piece of configuration is only necessary if you make use of inline
     * templates within Component metadata, e.g.:
     *
     * @Component({
     *  template: `<h1>Hello, World!</h1>`
     * })
     * ...
     *
     * It is not necessary if you only use .html files for templates.
     */
    // {
    //   files: ['*.component.ts'],
    //   parser: '@typescript-eslint/parser',
    //   parserOptions: {
    //     ecmaVersion: 2020,
    //     sourceType: 'module',
    //   },
    //   plugins: ['@angular-eslint/template'],
    //   processor: '@angular-eslint/template/extract-inline-html',
    // },
  ],
};
