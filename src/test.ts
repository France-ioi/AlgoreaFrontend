/* eslint-disable */
// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Define a mock appConfig for the test environment
const mockAppConfig = {
  production: false,
  apiUrl: 'https://dev.algorea.org/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  forumServerUrl: 'wss://iv4uwoi5v6.execute-api.eu-west-3.amazonaws.com/dev',
  searchApiUrl: 'https://jyz57q4k3ytekopv6tvg5bdxaq0vlgso.lambda-url.eu-west-3.on.aws',
  oauthClientId: '43',
  defaultActivityId: '4702',
  defaultSkillId: '3000',
  allUsersGroupId: '3',
  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'en', path: '/' },
  ],
  defaultTitle: 'Algorea Platform',
  languageSpecificTitles: { fr: 'Plateforme Algoréa' },
  allowForcedToken: true,
  authType: 'tokens',
  itemPlatformId: 'algorea_backend',
  theme: 'default',
  featureFlags: {
    hideTaskTabs: [],
    showGroupAccessTab: true,
  },
  redirects: { /* paths to be matched must not have a trailing slash */
    'home': { id: '4702', path: [] },
    'algorea/adventure': { id: '100575556387408660' },
    'officiels/algorea-serious-game/chapter': { id: '1471479157476024035', path: [ '4702' ] },
  },
};

(window as any).appConfig = mockAppConfig;

beforeEach(() => {
  (window as any).appConfig = mockAppConfig;
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  [ BrowserDynamicTestingModule, NoopAnimationsModule ],
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
  }
);
