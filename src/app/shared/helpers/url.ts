import { Location } from '@angular/common';
import { isString } from './type-checkers';

// Url array (`command` array used in some api of angular)
export interface UrlCommandParameters { [k: string]: string|string[] }
export type UrlCommand = (string|UrlCommandParameters)[];

export function getHashFragmentParams(): Map<string, string>{
  let hash = window.location.hash;
  hash = decodeURIComponent(hash);
  if (hash.indexOf('#') !== 0) {
    return new Map<string, string>();
  }
  const questionMarkPosition = hash.indexOf('?');
  if (questionMarkPosition > -1) {
    hash = hash.substring(questionMarkPosition + 1);
  } else {
    hash = hash.substring(1);
  }
  return parseQueryString(hash);
}

export function parseQueryString(queryString: string): Map<string, string> {
  const data = new Map<string, string>();
  let escapedKey, escapedValue: string;
  if (queryString === null) {
    return data;
  }
  for (const pair of queryString.split('&')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) continue;
    escapedKey = pair.substring(0, separatorIndex);
    escapedValue = pair.substring(separatorIndex + 1);
    let key = decodeURIComponent(escapedKey);
    const value = decodeURIComponent(escapedValue);
    if (key.substring(0, 1) === '/') {
      key = key.substring(1);
    }
    data.set(key, value);
  }
  return data;
}

export function getArgsFromUrl(): Map<string, string> {
  let queryString = window.location.search;
  if (!queryString || queryString.length === 0) {
    return getHashFragmentParams();
  }
  // normalize query string
  if (queryString.charAt(0) === '?') {
    queryString = queryString.substring(1);
  }
  return parseQueryString(queryString);
}

export function clearHash(paramNames: string[]): void {
  let href = location.href;
  for (const param of paramNames) {
    href = href.replace(new RegExp('[&\\?]'+param+'=[^&\\$]*'), '');
  }
  history.replaceState(null, window.name, href);
}

/**
 * Convert a valid url array (`commands` array) to the string url
 */
export function urlStringFromArray(urlAsArray: UrlCommand): string {
  // do not try to understand the implementation, just check the tests
  return urlAsArray.map((part, idx) => {
    if (part === '/') return '';
    else if (isString(part)) return (idx === 0 ? '' : '/') + part;
    else return Object.keys(part).map(key => {
      const val = part[key];
      if (val === undefined) throw new Error('unexpected: cannot find key in a dict while iterating over keys');
      const valStr = isString(val) ? val : val.join(',');
      return `;${ key }=${ valStr }`;
    }).join('');
  }).join('');
}

/**
 * Convert an absolute or relative path to a full url string
 */
function pathToUrl(href: string, location: Location): string {
  const isAbsolute = new RegExp('^(?:[a-z+]+:)?//', 'i').test(href);
  return isAbsolute ? href : window.location.origin + location.prepareExternalUrl(href);
}

export function replaceWindowUrl(href: string, location: Location): void {
  window.location.href = pathToUrl(href, location);
}
export function openNewTab(href: string, location: Location): void {
  window.open(pathToUrl(href, location), '_blank');
}

/**
 * Interprets a query param value as a boolean (or null if not set)
 * Consider any value as true except "0". Assume `boolToQueryParamValue` was used to encode.
 */
export function queryParamValueToBool(value: string | null): boolean | null {
  if (value === null) return null;
  return value !== '0';
}

export function boolToQueryParamValue(value: boolean): string {
  return value ? '1' : '0';
}
