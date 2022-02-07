import { Environment } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://dev.algorea.org/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  oauthClientId: '43',

  defaultActivityId: '4702',

  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'en', path: '/en/' },
  ],
  defaultTitle: 'Algorea Platform',
  languageSpecificTitles: { fr: 'Plateforme Algoréa' },

  allowForcedToken: true,
  authType: 'cookies',

  itemPlatformId: 'algorea_backend',
};

export const presets: Record<string, Partial<Environment>> = {
  example: {
    defaultActivityId: '1625159049301502151', // Motif Art
    defaultTitle: 'Example app',
    authType: 'tokens',
    itemPlatformId: 'Example',
  },
  demo: {
    defaultActivityId: '1352246428241737349', // SNT
    defaultTitle: 'Demo app'
  },
};

export function getPresetNameByDomain(domain: string): string | null {
  switch (domain) {
    case 'example.algorea.org': return 'example';
    default: return null;
  }
}

