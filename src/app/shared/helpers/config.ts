import { environment } from 'src/environments/environment';

interface TokenConfig { useTokens: true, useCookies: false }
type CookieConfig = { useTokens: false, useCookies: true } & ({ secure: true, sameSite: boolean } | { secure: boolean, sameSite: true })
export type AuthTypeConfig = TokenConfig | CookieConfig;

export type Environment = {
  production: boolean;

  apiUrl: string; // full url (not including the trailing slash) of the backend

  oauthServerUrl: string; // full url (not including the trailing slash) of the oauth server
  oauthClientId: string;

  // the id of the item to be loaded by default on home page (if no specific path is given) and in nav menu (if no other item is visited)
  // this item MUST be on one of all users' root and be implicitely startable
  defaultActivityId: string;
  defaultSkillId: string;

  languages?: { tag: string, path: string }[];

  // The auth type used with API is either `useToken: true` or `useCookies: true` (not both).
  // If using cookie `secure` or `sameSite` must be true (may be both). If `secure` the api has to be on the same domain as the API.st
} & AuthTypeConfig;

type Config = Environment; // config may be someday an extension of the environment

export const appConfig: Config = environment;
