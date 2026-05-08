import { test as base, ConsoleMessage } from '@playwright/test';

/**
 * Auto fixture that fails the test if Angular reports any NG#### code in the
 * browser console (warning/error) or as an uncaught page error.
 *
 * NG codes (e.g. NG0955, NG0956) are emitted by Angular in dev mode (which is
 * what `ng serve` runs) and signal real bugs we want to catch in CI rather
 * than have them silently degrade UX.
 *
 * Both `console.warn` and `console.error` are listened to: some NG codes are
 * warnings (e.g. NG0956 track-by identity), some are errors. `pageerror`
 * catches NG codes thrown as uncaught exceptions.
 */

interface ConsoleGuardFixtures {
  failOnAngularConsoleIssues: void,
}

const NG_CODE_PATTERN = /NG\d{4}/;

export const consoleGuard = base.extend<ConsoleGuardFixtures>({
  failOnAngularConsoleIssues: [
    async ({ page }, use, testInfo): Promise<void> => {
      const issues: string[] = [];

      const onConsole = (msg: ConsoleMessage): void => {
        const type = msg.type();
        if (type !== 'error' && type !== 'warning') return;
        const text = msg.text();
        if (NG_CODE_PATTERN.test(text)) {
          issues.push(`[console.${type}] ${text}`);
        }
      };
      const onPageError = (err: Error): void => {
        if (NG_CODE_PATTERN.test(err.message)) {
          issues.push(`[pageerror] ${err.message}`);
        }
      };

      page.on('console', onConsole);
      page.on('pageerror', onPageError);

      await use();

      page.off('console', onConsole);
      page.off('pageerror', onPageError);

      if (issues.length > 0) {
        await testInfo.attach('angular-console-issues', {
          body: issues.join('\n'),
          contentType: 'text/plain',
        });
        throw new Error(
          `Angular reported ${issues.length} NG#### console issue(s):\n${issues.join('\n')}`
        );
      }
    },
    { auto: true },
  ],
});
