import { ParamMap } from '@angular/router';
import { LanguageConfig } from './config';
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
    hash = hash.substr(questionMarkPosition + 1);
  } else {
    hash = hash.substr(1);
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
    escapedKey = pair.substr(0, separatorIndex);
    escapedValue = pair.substr(separatorIndex + 1);
    let key = decodeURIComponent(escapedKey);
    const value = decodeURIComponent(escapedValue);
    if (key.substr(0, 1) === '/') {
      key = key.substr(1);
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
    queryString = queryString.substr(1);
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

function formatUrl(href: string, currentLang?: LanguageConfig): string {
  const isAbsoluteHref = href.startsWith('http');
  if (isAbsoluteHref) return href;
  const url = new URL(currentLang?.path ?? '/', window.location.href);
  url.hash = href;
  return url.href;
}

export function replaceWindowUrl(href: string, currentLang?: LanguageConfig): void {
  window.location.href = formatUrl(href, currentLang);
}
export function openNewTab(href: string, currentLang?: LanguageConfig): void {
  window.open(formatUrl(href, currentLang), '_blank');
}

/**
 * Return the value of the given field as a boolean (or null if not set)
 * Interprets any value as true except "0" (if `boolToQueryParamValue` was used) or "false" (in case the boolean value was used directly
 * in url)
 */
export function boolFromParamMap(paramMap: ParamMap, field: string): boolean|null {
  const val = paramMap.get(field);
  if (val === null) return null;
  if (val === '0' || val === 'false') return false;
  return true;
}

export function boolToQueryParamValue(value: boolean): string {
  return value ? '1' : '0';
}
