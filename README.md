# Algorea Frontend

## Quick start

Run `npm install` first to use latest packages.
Run `ng build core` in order to use the core components in current project

##Project Structure

This app is made of 4 apps:
- **design** (in `/projects/design`, under `#/design` url) with the original design implementation (without much logic and not connected with the backend).
- **dev**  (in `/projects/design`, under `#/dev` url) with the ongoing development of the frontend logic connected to the backend.
- **core** (in `/projects/core`), the common components between *design* and *dev*.
- **algorea** (in `src`), the root routing to *dev* and *design*

## Contributing

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code Style

Run `ng lint` to launch the linter checks on the code.

For more general code style, we follow the [Angular coding style guide](https://angular.io/guide/styleguide).

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io). Press `Ctrl+C` to continue testing to next sub app or library(in test loop).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
