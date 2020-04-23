# FranceIoi

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.22.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## API Integration

You can get/set api url in the `src/environments/environment.ts`.
`src/app/shared/model` contains the model definitions and `src/app/shared/services/api` has api part.

- `auth.service.ts` is for authentication.
- `token.interceptor.ts` has token integration to every api call which you can get from `auth-service`.
- `group.service.ts` is responsible for `Group You Manage` related api calls.
- `current-user.service.ts` is responsible for `Group You Joined` related api calls.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
