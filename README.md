# Algorea Frontend

## Quick start

It is recommended to run this project on a recent node version (continuous integration use 14).

Run `npm install` first to use latest packages.

## Project Structure

The work-in-progress and proof-of-concept design is in the `design` part of this repository (auto-deployed on `http://dev.algorea.org/branch/design/`)

The rest of the project follow the recommended structure of an Angular project.

## Contributing

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

If you use the mock server - via `npm start`, copy mocks/environment.dev.ts to mocks/enviromnent.ts and update the dev token value.

## Code Style

Run `npm run lint` to launch the linter checks on the code.

Note that `ng lint` also run the linter but without the parser option (faster but on a subset of the rules) as it was not possible to
make it work properly for obscure reasons.

For more general code style, we follow the [Angular coding style guide](https://angular.io/guide/styleguide).

## Code auto-deployment

Every branch pushed to the repository is deployed on `http://dev.algorea.org/branch/<branch_name>/`. The `master` one is also deployed on http://dev.algorea.org/.

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io). Press `Ctrl+C` to continue testing to next sub app or library(in test loop).

### Running end-to-end tests

Run `E2E_AUTH_USER=[sessionStorageKey],[sessionStorageTokenValue] ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Internationalization

Every developer who adds text into the code should localize it. See the [Angular doc](https://angular.io/guide/i18n#prepare-templates-for-translations) to know how to mark it as localizable.

When a new translatable string has been added to the code, the developer runs `npm run extract-i18n` to generate the new translation file.

The generated files src/locale/messages.<lang>.xlf can be translated with a XLIFF editor, e.g. Poedit.

For development, the `ng serve` serve can only serve one language (by default, English). To use another language, use another configuration, for instance `ng serve --configuration=fr`.
The build process generates one website per language in `/en`, `/fr` directories.
