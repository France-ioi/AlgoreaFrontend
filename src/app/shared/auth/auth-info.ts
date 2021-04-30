import { SECONDS } from '../helpers/duration';

export type AuthStatus = NotAuthenticated|CookieAuthenticated|TokenAuthenticated;
export type AuthResult = CookieAuthenticated|TokenAuthenticated;

/* Different types of auth */
export interface NotAuthenticated { authenticated: false }
interface CookieAuthenticated { authenticated: true, useCookie: true, expiration: Date, creation: Date }
interface TokenAuthenticated { authenticated: true, useCookie: false, accessToken: string, expiration: Date, creation: Date }

/* Basic builder for these types */
export const notAuthenticated = ():NotAuthenticated => ({ authenticated: false });

export function cookieAuthenticated (expiration: Date):CookieAuthenticated {
  return { authenticated: true, useCookie: true, expiration: expiration, creation: new Date() };
}
function tokenAuthenticated(accessToken: string, expiration: Date, creation: Date):TokenAuthenticated {
  return { authenticated: true, useCookie: false, accessToken: accessToken, expiration: expiration, creation: creation };
}

/* Cookie-specific functions */
export function cookieAuthFromServiceResp(expiresIn: number): CookieAuthenticated {
  return cookieAuthenticated(expiresInToDate(expiresIn));
}

/* Token-specific functions */
const storageTokenKey = 'access_token';
const storageCreationKey = 'access_token_creation';
const storageExpirationKey = 'access_token_exp';
const tokenStorage = sessionStorage;

export function tokenAuthFromStorage(): TokenAuthenticated|undefined {
  const token = tokenStorage.getItem(storageTokenKey);
  const exp = tokenStorage.getItem(storageExpirationKey);
  const creation = tokenStorage.getItem(storageCreationKey);
  if (!token || !exp || !creation) return undefined;
  const expMs = +exp;
  const createMs = +creation;
  if (isNaN(expMs) || expMs <= Date.now() || isNaN(createMs)) {
    clearTokenFromStorage();
    return undefined; // invalid or expired expiration
  }
  return tokenAuthenticated(token, new Date(expMs), new Date(createMs));
}

export function tokenAuthFromServiceResp(token: string, expiresIn: number): TokenAuthenticated {
  const creation = new Date(); // now
  const expiration = expiresInToDate(expiresIn);
  tokenStorage.setItem(storageTokenKey, token);
  tokenStorage.setItem(storageCreationKey, creation.getTime().toString());
  tokenStorage.setItem(storageExpirationKey, expiration.getTime().toString());
  return tokenAuthenticated(token, expiration, creation);
}

export function clearTokenFromStorage(): void {
  tokenStorage.removeItem(storageTokenKey);
  tokenStorage.removeItem(storageCreationKey);
  tokenStorage.removeItem(storageExpirationKey);
}

function expiresInToDate(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn*SECONDS);
}
