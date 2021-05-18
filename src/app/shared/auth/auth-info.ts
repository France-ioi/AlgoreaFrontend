import { SECONDS, YEARS } from '../helpers/duration';

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
const storageForcedTokenKey = 'forced_token';
const tokenStorage = sessionStorage;

export function tokenAuthFromStorage(): TokenAuthenticated {
  const token = tokenStorage.getItem(storageTokenKey);
  const exp = tokenStorage.getItem(storageExpirationKey);
  const creation = tokenStorage.getItem(storageCreationKey);
  if (!token || !exp || !creation) throw new Error('unable to load the token from storage');
  const expMs = +exp;
  const createMs = +creation;
  if (isNaN(expMs) || expMs <= Date.now() || isNaN(createMs)) {
    clearTokenFromStorage();
    throw new Error('unable to load the stored token: invalid/expired creation or expiration date');
  }
  return tokenAuthenticated(token, new Date(expMs), new Date(createMs));
}

/**
 * Create a token from a service response.
 * @param expiresIn is the number of seconds before expiration
 */
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

export function hasForcedToken(): boolean {
  return tokenStorage.getItem(storageForcedTokenKey) !== null;
}

export function clearForcedTokenFromStorage(): void {
  tokenStorage.removeItem(storageForcedTokenKey);
}

export function setForcedTokenInStorage(token: string): void {
  tokenStorage.setItem(storageForcedTokenKey, token);
}

/**
 * Create a token-authentication which is valid for one year based on the value stored in `storageForcedTokenKey` in the store.
 * This is useful for dev to force a token for testing a user.
 * The expiration / creation are just values which will prevent the app to refresh the token, the actual security measures (and actual
 * validity duration) are handled by the backend.
 */
export function forcedTokenAuthFromStorage(): TokenAuthenticated {
  const token = tokenStorage.getItem(storageForcedTokenKey);
  if (!token) throw new Error('no forced token');
  return tokenAuthenticated(token, new Date(Date.now() + 1*YEARS), new Date()); // assume the token is valid for 1 year
}

function expiresInToDate(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn*SECONDS);
}
