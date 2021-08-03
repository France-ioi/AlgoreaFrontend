import { Environment } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: true,
  apiUrl: 'http://dev-algorea-org-898315810.eu-central-1.elb.amazonaws.com/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  oauthClientId: '43',

  defaultActivityId: '4702',
  defaultSkillId: '3000',

  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'en', path: '/en/' },
  ],
  allowForcedToken: true,
  authType: 'cookies',
};
