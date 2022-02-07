import { environment } from 'src/environments/environment';

export interface LanguageConfig {
  tag: string,
  path: string,
}

export interface Environment {
  production: boolean,

  apiUrl: string, // full url (not including the trailing slash) of the backend

  oauthServerUrl: string, // full url (not including the trailing slash) of the oauth server
  oauthClientId: string,

  // the id of the item to be loaded by default on home page (if no specific path is given) and in nav menu (if no other item is visited)
  // this item MUST be on one of all users' root and be implicitely startable
  defaultActivityId: string,

  // To add a default/fallback language, use a config with path = "/" and place it at the end.
  languages: LanguageConfig[],

  // Name for the website (on top of the left menu and as html 'title')
  defaultTitle: string,
  languageSpecificTitles?: { [key: string]: string },

  allowForcedToken: boolean, // for dev: allow devs to define 'forced_token' in storage so that this token is used in any case
  // The authType used with API is either 'tokens' or 'cookies'.

  authType: 'tokens' | 'cookies',

  itemPlatformId: string,
}

type Config = Environment; // config may be someday an extension of the environment
type ConfigOverride = Omit<Config, 'production' | 'allowForcedToken'>;
const presetNames = [ 'example', 'demo' ] as const;
type Preset = typeof presetNames[number];
const isPreset = (value: any): value is Preset => presetNames.includes(value as Preset);
const presetQueryParam = 'config_preset';

const presets: Record<Preset, Partial<ConfigOverride>> = {
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

export const appConfig: Config = {
  ...environment,
  ...getPresetConfigFromUrl(), // spreading `null` is fine
};

function getPresetConfigFromUrl(): Partial<ConfigOverride> | null {
  const preset = getPresetFromDomain() ?? getPresetFromQuery();
  return preset && presets[preset];
}

function getPresetFromQuery(): Preset | null {
  const url = globalThis.location.href;
  const search = url.includes('?') ? new URLSearchParams(url.slice(url.indexOf('?'))) : null;
  const preset = search?.get(presetQueryParam) ?? null;
  if (!preset) return null;
  if (!isPreset(preset)) throw new Error(`Unknown preset "${preset}", expected one of: ${presetNames.join(', ')}`);
  return preset;
}

function getPresetFromDomain(): Preset | null {
  switch (window.location.hostname) {
    case 'demo.algorea.org': return 'demo';
    case 'example.algorea.org': return 'example';
    default: return null;
  }
}
