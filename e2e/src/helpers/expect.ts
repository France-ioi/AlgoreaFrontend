import { browser } from 'protractor';

/**
 * Helper to mitigate protractor notorious flakyness:
 * - https://duckduckgo.com/?q=protractor+tests+are+flaky&t=canonical&ia=web
 * - https://www.google.com/search?q=protractor+tests+are+flaky
 * Although some tools exist, I tried protractor-errors and protractor-retry without success, so I got inspired from
 * that blog post: https://christianlydemann.com/life-saving-protractor-utilities-to-fix-flaky-end-to-end-tests/
 */

export async function expectOrRetry(
  expectFn: () => unknown | Promise<unknown>,
  pollInMs = 500,
  maxTries = 10,
  currentTry = 1,
): Promise<unknown> {
  if (currentTry > maxTries) throw new Error('should not happen');
  if (currentTry === maxTries) return expectFn();
  try {
    // NOTE: to catch the error properly, we need to await the result and not return directly
    const result = await expectFn();
    return result;
  } catch (error) {
    await browser.sleep(pollInMs);
    return expectOrRetry(expectFn, pollInMs, maxTries, currentTry + 1);
  }
}
