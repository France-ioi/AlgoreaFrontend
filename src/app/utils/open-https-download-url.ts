/**
 * Opens a download URL only when it is an absolute https: URL.
 * Uses a temporary anchor with target=_blank so a bad/attachment-less response does not unload the SPA.
 */
export function isHttpsAbsoluteUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function openHttpsDownloadUrl(url: string): boolean {
  if (!isHttpsAbsoluteUrl(url)) return false;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noopener noreferrer';
  anchor.target = '_blank';
  // Hint download; browsers often ignore this for cross-origin URLs (e.g. S3), which is fine.
  anchor.setAttribute('download', '');
  anchor.click();
  return true;
}
