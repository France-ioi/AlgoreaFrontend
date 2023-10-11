import { SECONDS } from '../../utils/duration';
import {
  clearForcedTokenFromStorage,
  clearTokenFromStorage,
  forcedTokenAuthFromStorage,
  hasForcedToken,
  setForcedTokenInStorage,
  tokenAuthFromServiceResp,
  tokenAuthFromStorage
} from './auth-info';

describe('auth-info', () => {

  const expectedToken = 'atoken';
  const expiresInSec = 60;
  const expiresInMS = expiresInSec*SECONDS;
  const precision = -3; // the 3 lower digits may be different = 1s precison

  beforeEach(function() {
    clearTokenFromStorage();
    clearForcedTokenFromStorage();
  });

  it('should save & load successfully a token', () => {
    const now = Date.now();

    const auth = tokenAuthFromServiceResp(expectedToken, expiresInSec);
    const loaded = tokenAuthFromStorage();

    expect(auth.accessToken).toEqual(expectedToken);
    expect(auth.creation.getTime()-now).toBeCloseTo(0,precision);
    expect(auth.expiration.getTime()-now).toBeCloseTo(expiresInMS,precision);

    expect(loaded.accessToken).toEqual(expectedToken);
    expect(loaded.creation.getTime()).toBeCloseTo(now,precision);
    expect(loaded.expiration.getTime()).toBeCloseTo(now+expiresInMS,precision);
  });

  it('should fail when loading a token with no token', () => {
    tokenAuthFromServiceResp(expectedToken, expiresInSec);
    sessionStorage.removeItem('access_token');
    expect(tokenAuthFromStorage).toThrowError();
  });

  it('should fail when loading a token with no expiration', () => {
    tokenAuthFromServiceResp(expectedToken, expiresInSec);
    sessionStorage.removeItem('access_token_exp');
    expect(tokenAuthFromStorage).toThrowError();
  });

  it('should fail (and clear) when loading a expired token', () => {
    tokenAuthFromServiceResp(expectedToken, -1 /* expired 1sec ago */);
    expect(tokenAuthFromStorage).toThrowError();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should fail (and clear) when loading an invalid token', () => {
    tokenAuthFromServiceResp(expectedToken, expiresInSec);
    sessionStorage.setItem('access_token_exp', 'not a number');
    expect(tokenAuthFromStorage).toThrowError();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should clear token with clearTokenFromStorage()', () => {
    tokenAuthFromServiceResp(expectedToken, expiresInSec);
    const loaded = tokenAuthFromStorage();
    expect(loaded.authenticated).toBeTrue();
    expect(loaded.useCookie).toBeFalse();
    clearTokenFromStorage();
    expect(tokenAuthFromStorage).toThrowError();
  });

  it('should not load forced token when none is defined', () => {
    expect(hasForcedToken()).toBeFalse();
    expect(forcedTokenAuthFromStorage).toThrowError();
  });

  it('should load forced token when defined', () => {
    setForcedTokenInStorage(expectedToken);
    expect(hasForcedToken()).toBeTrue();
    expect(forcedTokenAuthFromStorage().accessToken).toEqual(expectedToken);
  });

});
