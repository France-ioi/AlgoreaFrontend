import { Page } from '@playwright/test';

async function setForcedToken(page: Page, token: string): Promise<void> {
  return page.addInitScript(token => {
    window.sessionStorage.setItem('forced_token', token);
  }, token);
}

export function initAsUsualUser(page: Page): Promise<void> {
  const key = process.env.E2E_USUALUSER_TOKEN;
  if (!key) throw new Error('a key for the usual key should be provided in "E2E_USUALUSER_TOKEN" env var');
  return setForcedToken(page, key);
}

export function initAsDemoUser(page: Page, token: string): Promise<void> {
  return setForcedToken(page, token);
}
