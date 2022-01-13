const storage = globalThis.sessionStorage;
const redirectToSubPathKey = 'redirect_to_sub_path';

export function setRedirectToSubPathAtInit(subPath: string): void {
  storage.setItem(redirectToSubPathKey, subPath);
}

export function getRedirectToSubPathAtInit(): string | null {
  return storage.getItem(redirectToSubPathKey);
}

export function removeSubPathRedirectionAtInit(): void {
  storage.removeItem(redirectToSubPathKey);
}

