import { SECONDS } from '../helpers/duration';
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

  const expiresInSec = 60;
  const expiresInMS = expiresInSec*SECONDS;
  const precision = -3; // the 3 lower digits may be different = 1s precison

  beforeEach(function() {
    clearTokenFromStorage();
    clearForcedTokenFromStorage();
  });

  it('should save & load successfully a token', () => {
    const now = Date.now();

    const auth = tokenAuthFromServiceResp('atemptok', expiresInSec);
    const loaded = tokenAuthFromStorage();

    expect(auth.accessToken).toEqual('atemptok');
    expect(auth.creation.getTime()-now).toBeCloseTo(0,precision);
    expect(auth.expiration.getTime()-now).toBeCloseTo(expiresInMS,precision);

    expect(loaded?.accessToken).toEqual('atemptok');
    if (loaded) {
      expect(loaded.creation.getTime()).toBeCloseTo(now,precision);
      expect(loaded.expiration.getTime()).toBeCloseTo(now+expiresInMS,precision);
    }
  });

  it('should fail when loading a token with no token', () => {
    tokenAuthFromServiceResp('atemptok', expiresInSec);
    sessionStorage.removeItem('access_token');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
  });

  it('should fail when loading a token with no expiration', () => {
    tokenAuthFromServiceResp('atemptok', expiresInSec);
    sessionStorage.removeItem('access_token_exp');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
  });

  it('should fail (and clear) when loading a expired token', () => {
    tokenAuthFromServiceResp('atemptok', -1 /* expired 1sec ago */);
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should fail (and clear) when loading an invalid token', () => {
    tokenAuthFromServiceResp('atemptok', -1 /* expired 1sec ago */);
    sessionStorage.setItem('access_token_exp', 'not a number');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should clear token with clearTokenFromStorage()', () => {
    tokenAuthFromServiceResp('atemptok', expiresInSec);
    const loaded = tokenAuthFromStorage();
    expect(loaded?.authenticated).toBeTrue();
    expect(loaded?.useCookie).toBeFalse();
    clearTokenFromStorage();
    const loaded2 = tokenAuthFromStorage();
    expect(loaded2).toBeUndefined();
  });

  it('should not load forced token when none is defined', () => {
    expect(hasForcedToken()).toBeFalse();
    expect(forcedTokenAuthFromStorage()).toBeUndefined();
  });

  it('should load forced token when defined', () => {
    setForcedTokenInStorage('atemptok');
    expect(hasForcedToken()).toBeTrue();
    expect(forcedTokenAuthFromStorage()?.accessToken).toEqual('atemptok');
  });

});
