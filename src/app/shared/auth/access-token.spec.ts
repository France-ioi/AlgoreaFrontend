import { AccessToken } from './access-token';

describe('AccessToken', () => {

  beforeEach(function() {
    AccessToken.clearFromStorage();
  });

  it('should save & load successfully a temp token', () => {
    const exp = new Date(Date.now() + 60000);
    const token = new AccessToken('atemptok', exp, 'temporary');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded.accessToken).toEqual('atemptok');
    expect(loaded.expiration).toEqual(exp);
    expect(loaded.type).toEqual('temporary');
    expect(loaded.isValid()).toBeTruthy();
  });

  it('should load successfully an authenticated token', () => {
    const exp = new Date(Date.now() + 60001);
    const token = new AccessToken('aauthtoken', exp, 'authenticated');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded.accessToken).toEqual('aauthtoken');
    expect(loaded.expiration).toEqual(exp);
    expect(loaded.type).toEqual('authenticated');
    expect(loaded.isValid()).toBeTruthy();
  });

  it('should fail when loading a token with no token', () => {
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('access_token');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should fail when loading a token with no expiration', () => {
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('access_token_exp');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should fail (and clear) when loading a expired token', () => {
    const exp = new Date(Date.now() - 1);
    const token = new AccessToken('atoken', exp, 'authenticated');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
    expect(sessionStorage.getItem('user_type')).toBeNull();
  });

  it('should fail (and clear) when loading a invalid token', () => {
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.setItem('access_token_exp', 'not a number');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
    expect(sessionStorage.getItem('user_type')).toBeNull();
  });

  it('should fail when loading a token with no type', () => {
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('user_type');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should load a token from countdown', () => {
    const token = AccessToken.fromCountdown('fromcountdown', 60 /* 1 minute */, 'temporary');
    const diff = token.expiration.getTime() - Date.now();
    expect(diff).toBeLessThanOrEqual(60000);
    expect(diff).toBeGreaterThan(59000);
    expect(token.accessToken).toEqual('fromcountdown');
    expect(token.type).toEqual('temporary');
    expect(token.isValid()).toBeTruthy();
  });

  it('should clear token with clearFromStorage()', () => {
    const exp = new Date(Date.now() + 60004);
    const token = new AccessToken('atemptok', exp, 'temporary');
    token.saveToStorage();
    let loaded = AccessToken.fromStorage();
    expect(loaded.isValid()).toBeTruthy();
    AccessToken.clearFromStorage();
    loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should consider invalid a token with an empty access token', () => {
    const exp = new Date(Date.now() + 60004);
    const token = new AccessToken('', exp, 'temporary');
    expect(token.isValid()).toBeFalsy();
  });

  it('should consider invalid a token with an expired token', () => {
    const exp = new Date(Date.now() - 1);
    const token = new AccessToken('abc', exp, 'temporary');
    expect(token.isValid()).toBeFalsy();
  });

});
