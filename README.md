# Algorea Frontend

Current translation status: [![Crowdin](https://badges.crowdin.net/algorea/localized.svg)](https://crowdin.com/project/algorea)

## Quick start

It is recommended to run this project on a recent node version (continuous integration use 14).

Run `npm install` first to use latest packages.

## Project (Files & Directories ) Structure

Globally the project follows the recommended structure of an Angular project.

The app code stands in the `src/app` directory. In this root directory and all of the feature directories, the structure is the following:
```
.
└── store: ngrx store related files
    └── rootstore.reducer|state|action|selector.ts
    └── anotherstore
        └── anotherstore.reducer|state|action|selector.ts
└── containers: smart-component, i.e. organizational wrappers around presentational or other container component
    └── my-first-comp
        └── my-first-comp.component.html|scss|spec.ts|ts
└── ui-components: "dumb/presentational components", i.e., purely concerned with looks, don’t maintain state, depend on services or perform computations
└── pipes
└── directives
└── guards
└── models: domain models (classes, types, ..)
└── data-access (http, ws services and related files)
└── services: regular angular services (non http related) (should disappear in favor of stores)
└── utils: general utility functions
└── feature1: sub-feature of the current directory, which contains the same file structure
└── feature2
└── ...
```
For each non-feature directory, if it is almost empty, you may consider putting all files directly in parent directory as long as their type is included in their file name, e.g. stuff.model.ts.

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

Set the user token in `.e2e.env` (start from the sample in `.e2e.env.sample`).
Launch the web server (`ng serve`).
Run all tests:
```
npx playwright test
```
Check [playwright doc](https://playwright.dev/docs/running-tests) for more options. 

### Writing end-to-end tests

E2E tests uses the "Playwright" lib. The easiest way to write E2E tests is to use VSCode extension, then:
- launch the server manually `ng serve`
- create a test and bootstrap it manually, for instance:
```ts
test('home page loaded as usual user', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/');
  // keep your cursor here
});
```
- in testing menu, check "show browser"
- execute the test
- press "record at cursor" so that all new actions in the browser are added where you cursor is
- cleanup what has been generated

## Internationalization

Every developer who adds text into the code should localize it. See the [Angular doc](https://angular.io/guide/i18n#prepare-templates-for-translations) to know how to mark it as localizable.

When a new translatable string has been added to the code, it will be pushed to our service online for translation when it is merged into the `master` branch. There is no way to test the translated versions of the website on a deployed developpement branch.

The translated strings will be retrieved online when the `master` branch is built and when a version is created.
