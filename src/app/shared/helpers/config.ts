import { environment } from 'src/environments/environment';

export interface Environment {
  production: boolean;

  apiUrl: string; // full url (not including the trailing slash) of the backend

  oauthServerUrl: string; // full url (not including the trailing slash) of the oauth server
  oauthClientId: string;

  // the id of the item to be loaded by default on home page (if no specific path is given) and in nav menu (if no other item is visited)
  // this item must be on all users' root, otherwise every user will get an error causing a redirect and extra requests
  defaultItemId: string;
}

type Config = Environment; // config may be someday an extension of the environment

export function appConfig(): Config {
  return environment;
}
