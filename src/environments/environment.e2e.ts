import { Environment } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: false,
  apiUrl: 'https://dev.algorea.org/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  oauthClientId: '43',

  defaultActivityId: '4702',

  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'en', path: '/' },
  ],
  defaultTitle: 'Algorea Platform',
  allowForcedToken: true,
  authType: 'tokens',

  itemPlatformId: 'http://algorea.pem.dev',
};
