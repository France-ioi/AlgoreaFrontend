import { environment, presets, getPresetNameByOrigin } from 'src/environments/environment';

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

const presetQueryParam = 'config_preset';
function getPresetNameFromQuery(): string | null {
  const url = globalThis.location.href;
  const search = url.includes('?') ? new URLSearchParams(url.slice(url.indexOf('?'))) : null;
  return search?.get(presetQueryParam) ?? null;
}

const origin = `${globalThis.location.protocol}//${globalThis.location.hostname}`;
const presetName = getPresetNameByOrigin(origin) ?? getPresetNameFromQuery();

export const appConfig: Config = {
  ...environment,
  ...(presetName ? presets[presetName as keyof typeof presets] : undefined),
};
