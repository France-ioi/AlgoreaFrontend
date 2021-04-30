import { clearTokenFromStorage, tokenAuthFromServiceResp, tokenAuthFromStorage } from './auth-info';

describe('auth-info', () => {

  beforeEach(function() {
    clearTokenFromStorage();
  });

  it('should save & load successfully a token', () => {
    const now = Date.now();
    const auth = tokenAuthFromServiceResp('atemptok', 60);
    const loaded = tokenAuthFromStorage();

    expect(auth.accessToken).toEqual('atemptok');
    expect(auth.creation.getTime()-now).toBeCloseTo(0,-3);
    expect(auth.expiration.getTime()-now).toBeCloseTo(60000,-3);

    expect(loaded?.accessToken).toEqual('atemptok');
    expect((loaded?.creation.getTime()||0)-now).toBeCloseTo(0,-3);
    expect((loaded?.expiration.getTime()||0)-now).toBeCloseTo(60000,-3);
  });

  it('should fail when loading a token with no token', () => {
    tokenAuthFromServiceResp('atemptok', 60000);
    sessionStorage.removeItem('access_token');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
  });

  it('should fail when loading a token with no expiration', () => {
    tokenAuthFromServiceResp('atemptok', 60000);
    sessionStorage.removeItem('access_token_exp');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
  });

  it('should fail (and clear) when loading a expired token', () => {
    tokenAuthFromServiceResp('atemptok', -1000);
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should fail (and clear) when loading an invalid token', () => {
    tokenAuthFromServiceResp('atemptok', -1000);
    sessionStorage.setItem('access_token_exp', 'not a number');
    const loaded = tokenAuthFromStorage();
    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
  });

  it('should clear token with clearTokenFromStorage()', () => {
    tokenAuthFromServiceResp('atemptok', 1000);
    const loaded = tokenAuthFromStorage();
    expect(loaded?.authenticated).toBeTrue();
    expect(loaded?.useCookie).toBeFalse();
    clearTokenFromStorage();
    const loaded2 = tokenAuthFromStorage();
    expect(loaded2).toBeUndefined();
  });

});
