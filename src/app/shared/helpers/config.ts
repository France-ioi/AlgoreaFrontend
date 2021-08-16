import { environment } from 'src/environments/environment';

export interface LanguageConfig {
  tag: string,
  path: string,
}

export interface Environment {
  production: boolean;

  apiUrl: string; // full url (not including the trailing slash) of the backend

  oauthServerUrl: string; // full url (not including the trailing slash) of the oauth server
  oauthClientId: string;

  // the id of the item to be loaded by default on home page (if no specific path is given) and in nav menu (if no other item is visited)
  // this item MUST be on one of all users' root and be implicitely startable
  defaultActivityId: string;

  // To add a default/fallback language, use a config with path = "/" and place it at the end.
  languages: LanguageConfig[];

  allowForcedToken: boolean, // for dev: allow devs to define 'forced_token' in storage so that this token is used in any case
  // The authType used with API is either 'tokens' or 'cookies'.

  authType: 'tokens' | 'cookies',
}

type Config = Environment; // config may be someday an extension of the environment

export const appConfig: Config = environment;
