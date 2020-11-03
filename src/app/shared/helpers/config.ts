import { environment } from 'src/environments/environment';

export interface Environment {
  production: boolean;

  apiUrl: string; // full url (not including the trailing slash) of the backend

  oauthServerUrl: string; // full url (not including the trailing slash) of the oauth server
  oauthClientId: string;
}

type Config = Environment; // config may be someday an extension of the environment

export function appConfig(): Config {
  return environment;
}
