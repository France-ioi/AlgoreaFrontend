
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

