import { convertToParamMap, Params } from '@angular/router';
import { boolToQueryParamValue, clearHash, queryParamValueToBool, urlStringFromArray } from './url';

describe('clearHash', () => {
  const oidcParams = [ 'code', 'state', 'session_state', 'iss', 'error', 'error_description' ];
  let replaceStateSpy: jasmine.Spy;
  let originalHref: string;

  beforeEach(() => {
    originalHref = location.href;
  });

  afterEach(() => {
    replaceStateSpy?.and.callThrough();
    history.replaceState(null, '', originalHref);
  });

  /** Set the current URL, then spy on the replaceState call made by clearHash. */
  function setUrlAndSpy(pathQueryHash: string): void {
    history.replaceState(null, '', pathQueryHash);
    replaceStateSpy = spyOn(history, 'replaceState');
  }

  function replacedUrl(): URL {
    expect(replaceStateSpy).toHaveBeenCalled();
    return new URL(replaceStateSpy.calls.mostRecent().args[2] as string);
  }

  it('should strip Keycloak OIDC leftovers and preserve matrix params', () => {
    setUrlAndSpy(
      '/en/a/home;pa=0?code=abc&state=xyz&session_state=ss&iss=https%3A%2F%2Fidp.example%2F'
    );
    clearHash(oidcParams);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('');
  });

  it('should strip legacy code+state login params and leave a clean path', () => {
    setUrlAndSpy('/en/a/home;pa=0?code=abc&state=xyz');
    clearHash([ 'code', 'state' ]);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('');
  });

  it('should preserve matrix params when no query remains', () => {
    setUrlAndSpy('/en/a/home;pa=0?code=abc');
    clearHash([ 'code' ]);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('');
  });

  it('should keep unrelated query params correctly rejoined without a leading &', () => {
    setUrlAndSpy('/en/a/home;pa=0?code=abc&state=xyz&foo=bar');
    clearHash([ 'code', 'state' ]);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('?foo=bar');
  });

  it('should preserve the hash fragment', () => {
    setUrlAndSpy('/en/a/home;pa=0?code=abc#section');
    clearHash([ 'code' ]);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('');
    expect(url.hash).toBe('#section');
  });

  it('should not clear OIDC params that live only in the hash fragment (query-only scope)', () => {
    setUrlAndSpy('/en/a/home;pa=0#code=abc&state=xyz');
    clearHash([ 'code', 'state' ]);
    const url = replacedUrl();
    expect(url.pathname).toBe('/en/a/home;pa=0');
    expect(url.search).toBe('');
    expect(url.hash).toBe('#code=abc&state=xyz');
  });

  it('should not remove session_state when only clearing state (no prefix collision)', () => {
    setUrlAndSpy('/en/a/home?state=xyz&session_state=ss');
    clearHash([ 'state' ]);
    const url = replacedUrl();
    expect(url.searchParams.has('state')).toBeFalse();
    expect(url.searchParams.get('session_state')).toBe('ss');
  });
});

describe('urlStringFromArray', () => {
  it('should convert correctly a complex absolute case', () => {
    expect(urlStringFromArray([ '/', 'a', '123', { a: '99', p: [ '4','5','6' ] }]))
      .toEqual('/a/123;a=99;p=4,5,6');
  });

  it('should convert correctly a complex relative case', () => {
    expect(urlStringFromArray([ '123', { a: '99', p: [ '4','5','6' ] }]))
      .toEqual('123;a=99;p=4,5,6');
  });

});

describe('bool value in url processing', () => {
  const field = 'demoField';

  it('should encode correctly a truthy value', () => {
    const params: Params = {};
    params[field] = boolToQueryParamValue(true);
    const map = convertToParamMap(params);
    expect(queryParamValueToBool(map.get(field))).toBeTrue();
  });

  it('should encode correctly a falsy value', () => {
    const params: Params = {};
    params[field] = boolToQueryParamValue(false);
    const map = convertToParamMap(params);
    expect(queryParamValueToBool(map.get(field))).toBeFalse();
  });

  it('should correctly handle field not set', () => {
    const map = convertToParamMap({ 'anotherField': 1 });
    expect(queryParamValueToBool(map.get(field))).toBeNull();
  });

});
