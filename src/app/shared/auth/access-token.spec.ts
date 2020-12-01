import { AccessToken } from './access-token';

describe('AccessToken', () => {

  beforeEach(function() {
    AccessToken.clearFromStorage();
  });

  it('should save & load successfully a temp token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60000);
    const token = new AccessToken('atemptok', creationTime, exp, 'temporary');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded?.accessToken).toEqual('atemptok');
    expect(loaded?.creation).toEqual(creationTime);
    expect(loaded?.expiration).toEqual(exp);
    expect(loaded?.type).toEqual('temporary');
    expect(loaded?.isValid()).toBeTruthy();
  });

  it('should load successfully an authenticated token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60001);
    const token = new AccessToken('aauthtoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded?.accessToken).toEqual('aauthtoken');
    expect(loaded?.creation).toEqual(creationTime);
    expect(loaded?.expiration).toEqual(exp);
    expect(loaded?.type).toEqual('authenticated');
    expect(loaded?.isValid()).toBeTruthy();
  });

  it('should fail when loading a token with no token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('access_token');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should fail when loading a token with no expiration', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('access_token_exp');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should fail (and clear) when loading a expired token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() - 1);
    const token = new AccessToken('atoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
    expect(sessionStorage.getItem('user_type')).toBeNull();
  });

  it('should fail (and clear) when loading a invalid token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.setItem('access_token_exp', 'not a number');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token_exp')).toBeNull();
    expect(sessionStorage.getItem('user_type')).toBeNull();
  });

  it('should fail when loading a token with no type', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60002);
    const token = new AccessToken('atoken', creationTime, exp, 'authenticated');
    token.saveToStorage();
    sessionStorage.removeItem('user_type');
    const loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should load a token from countdown', () => {
    const token = AccessToken.fromTTL('fromttl', 60 /* 1 minute */, 'temporary');
    const diff = token.expiration.getTime() - Date.now();
    expect(diff).toBeLessThanOrEqual(60000);
    expect(diff).toBeGreaterThan(59000);
    expect((token.creation.getTime() - Date.now())/1000).toEqual(0);
    expect(token.accessToken).toEqual('fromttl');
    expect(token.type).toEqual('temporary');
    expect(token.isValid()).toBeTruthy();
  });

  it('should clear token with clearFromStorage()', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60004);
    const token = new AccessToken('atemptok', creationTime, exp, 'temporary');
    token.saveToStorage();
    let loaded = AccessToken.fromStorage();
    expect(loaded?.isValid()).toBeTruthy();
    AccessToken.clearFromStorage();
    loaded = AccessToken.fromStorage();
    expect(loaded).toBeNull();
  });

  it('should consider invalid a token with an empty access token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() + 60004);
    const token = new AccessToken('', creationTime, exp, 'temporary');
    expect(token.isValid()).toBeFalsy();
  });

  it('should consider invalid a token with an expired token', () => {
    const creationTime = new Date();
    const exp = new Date(Date.now() - 1);
    const token = new AccessToken('abc', creationTime, exp, 'temporary');
    expect(token.isValid()).toBeFalsy();
  });

});
