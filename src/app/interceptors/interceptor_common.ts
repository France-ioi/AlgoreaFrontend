import { HttpContextToken, HttpRequest } from '@angular/common/http';
import { appConfig } from '../utils/config';

const defaultTimeout = 6000;

/**
 * Define the context token which are used by interceptors and which may be overriden by services
 */
export const requestTimeout = new HttpContextToken(() => defaultTimeout);
export const useAuthInterceptor = new HttpContextToken(() => true);
export const retryOnceOn401 = new HttpContextToken(() => true);

export function isRequestToApi(req: HttpRequest<unknown>): boolean {
  return req.url.toLowerCase().startsWith(appConfig.apiUrl);
}

