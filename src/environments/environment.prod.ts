import { Environment, PartialDeep } from 'src/app/shared/helpers/config';

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  forumServerUrl: 'wss://iv4uwoi5v6.execute-api.eu-west-3.amazonaws.com/dev',
  oauthServerUrl: 'https://login.france-ioi.org',
  oauthClientId: '43',
  sentryDsn: 'https://6295834d69104f54b55cc0ebe4ada310@o1167067.ingest.sentry.io/6257761',

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
    skillsDisabled: false,
    showGroupAccessTab: true,
  },

  redirects: {
    'home': '4702'
  }
};

type Preset = 'telecomParis';
export const presets: Record<Preset, PartialDeep<Environment>> = {
  telecomParis: {
    theme: 'coursera-pt',
  },
};

export function getPresetNameByOrigin(origin: string): Preset | null {
  switch (origin) {
    case 'https://telecom-paris.france-ioi.org': return 'telecomParis';
    default: return null;
  }
}

