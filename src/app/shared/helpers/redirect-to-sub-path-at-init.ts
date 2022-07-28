const storage = globalThis.sessionStorage;
const redirectToSubPathKey = 'redirect_to_sub_path';
export const fromPathKey = 'from_path';

export function setRedirectToSubPathAtInit(subPath: string): void {
  storage.setItem(redirectToSubPathKey, subPath);
}

export function getRedirectToSubPathAtInit(): string | null {
  return storage.getItem(redirectToSubPathKey);
}

export function removeSubPathRedirectionAtInit(): void {
  storage.removeItem(redirectToSubPathKey);
}

export function appendUrlWithQuery(currentUrl: string, query: string, value: string): string {
  const url = new URL(currentUrl, location.origin);
  url.searchParams.set(query, value);
  return url.pathname + url.search;
}

export function urlToRedirectTo(options: { from: string }): string | null {
  const url = getRedirectToSubPathAtInit();
  if (!url) return null;
  removeSubPathRedirectionAtInit();
  return appendUrlWithQuery(url, fromPathKey, options.from);
}
