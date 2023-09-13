import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      if (process.env.E2E_AUTH_USER) {
        const [ authTokenKey, authTokenValue ] = process.env.E2E_AUTH_USER?.split(',') ?? [];
        if (!authTokenKey || !authTokenValue) throw new Error('Env var "E2E_AUTH_USER=[key],[value]" must be provided');

        config.env.E2E_AUTH_TOKEN_KEY = authTokenKey;
        config.env.E2E_AUTH_TOKEN_VALUE = authTokenValue;
      }
      return config;
    },
    defaultCommandTimeout: 10000,
    experimentalMemoryManagement: true,
  },
  video: false,
  screenshotOnRunFailure: false,
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  },
});
