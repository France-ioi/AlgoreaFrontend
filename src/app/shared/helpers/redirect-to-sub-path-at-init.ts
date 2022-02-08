const storage = globalThis.sessionStorage;
const redirectToSubPathKey = 'redirect_to_sub_path';
export const fromPathKey = 'from_path';
export const allowFromPathKey = 'allow_from_path';

export function setRedirectToSubPathAtInit(subPath: string): void {
  storage.setItem(redirectToSubPathKey, subPath);
}

export function getRedirectToSubPathAtInit(): string | null {
  return storage.getItem(redirectToSubPathKey);
}

export function removeSubPathRedirectionAtInit(): void {
  storage.removeItem(redirectToSubPathKey);
}

export function getUrlWithFromPath(currentUrl: string, fromPath: string): string {
  const url = new URL(currentUrl, location.origin);
  url.searchParams.set(fromPathKey, fromPath);
  return url.pathname + url.search;
}

export function getUrlWithAllowFromPath(currentUrl: string): string {
  const url = new URL(currentUrl, location.origin);
  url.searchParams.set(allowFromPathKey, '1');
  return url.pathname + url.search;
}
