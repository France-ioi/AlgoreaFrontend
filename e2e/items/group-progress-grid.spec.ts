import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

test('check table header', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter?watchedGroupId=4462192261130512818');

  await test.step('check the path is the same as this page', async () => {
    const firstChildLink = page.locator('alg-group-progress-grid p-table thead th:nth-child(2) a');
    await expect.soft(firstChildLink).toBeVisible();
    expect.soft(await firstChildLink.getAttribute('href')).toContain('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter');
  });

  await test.step('check the path to children', async () => {
    const firstChildLink = page.locator('alg-group-progress-grid p-table thead th:nth-child(3) a');
    await expect.soft(firstChildLink).toBeVisible();
    const href = await firstChildLink.getAttribute('href');
    expect.soft(href).toContain('/a/6379723280369399253;p=7528142386663912287,7523720120450464843;pa=0/progress/chapter');
  });
});

test('check user progress detail', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7523720120450464843;p=7528142386663912287;a=0/progress/chapter?watchedGroupId=4462192261130512818');
  await page.locator('alg-group-progress-grid p-table tr:nth-child(1) td:nth-child(3) alg-score-ring').click();

  await test.step('check view answer row', async () => {
    const viewAnswerRow = page.getByText('View answer');
    await expect(viewAnswerRow).toBeVisible();
    const href = await viewAnswerRow.getAttribute('href');
    expect.soft(href).toContain(
      '/a/6379723280369399253;p=7528142386663912287,7523720120450464843;pa=0;answerBest=1;answerParticipantId=752024252804317630'
    );
  });
});
