import type { Page } from '@playwright/test';

/**
 * AlgErrorHandler sends "Too many redirections" throws to Sentry without console.error / pageerror.
 * Detect them by wrapping the Error constructor.
 */
export async function installTooManyRedirectionsDetector(page: Page): Promise<void> {
  await page.addInitScript(`(() => {
    window.__tooManyRedirections = false;
    const OriginalError = window.Error;
    window.Error = function (message) {
      const error = new OriginalError(message);
      if (String(message ?? '').includes('Too many redirections')) {
        window.__tooManyRedirections = true;
      }
      return error;
    };
    window.Error.prototype = OriginalError.prototype;
  })();`);
}

export async function hasThrownTooManyRedirections(page: Page): Promise<boolean> {
  return page.evaluate(
    () => (window as unknown as { __tooManyRedirections?: boolean }).__tooManyRedirections === true
  );
}
