// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment, PartialDeep } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: false,
  apiUrl: 'https://dev.algorea.org/api', // 'http://localhost:3000/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  forumServerUrl: 'wss://iv4uwoi5v6.execute-api.eu-west-3.amazonaws.com/dev',
  oauthClientId: '43',

  defaultActivityId: '4702',

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
    skillsDisabled: false,
    showGroupAccessTab: true,
  },

  /* eslint-disable @typescript-eslint/naming-convention */
  redirects: {
    'home': { id: '4702', path: [] },
    'algorea/adventure': { id: '100575556387408660' },
    'officiels/algorea-serious-game': { id: '1471479157476024035', path: [ '4702' ] },
  }
  /* eslint-enable @typescript-eslint/naming-convention */
};

type Preset = 'demo';
export const presets: Record<Preset, PartialDeep<Environment>> = {
  demo: {
    defaultActivityId: '1352246428241737349', // SNT
    defaultTitle: 'Demo app',
    authType: 'cookies',
    theme: 'coursera-pt',
  },
};

export function getPresetNameByOrigin(origin: string): Preset | null {
  switch (origin) {
    case 'http://demo.localhost': return 'demo';
    default: return null;
  }
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
