import { Environment, PartialDeep } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
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

  theme: 'default',
  featureFlags: {
    hideTaskTabs: [],
    hideActivityProgressTab: false,
  }
};

type Preset = 'telecomParis';
export const presets: Record<Preset, PartialDeep<Environment>> = {
  telecomParis: {
    theme: 'coursera-pt',
    featureFlags: {
      hideActivityProgressTab: true,
    }
  },
};

export function getPresetNameByOrigin(origin: string): Preset | null {
  switch (origin) {
    case 'https://telecom-paris.france-ioi.org': return 'telecomParis';
    default: return null;
  }
}

