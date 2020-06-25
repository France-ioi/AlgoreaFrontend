# Algorea Frontend

## Quick start

It is recommended to run this project on Node 12. The Continuous Integration is run on this version.

Run `npm install` first to use latest packages.

## Project Structure

The work-in-progress and proof-of-concept design is in the `design` part of this repository (auto-deployed on `http://dev.algorea.org/branch/design/`)

The rest of the project follow the recommended structure of an Angular project.

## Contributing

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code Style

Run `ng lint` to launch the linter checks on the code.

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

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
