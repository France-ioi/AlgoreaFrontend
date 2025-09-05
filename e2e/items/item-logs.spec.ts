import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

const otherItemJson = [
  {
    'at': '2024-07-16T15:27:24Z',
    'activity_type': 'saved_answer',
    'attempt_id': '0',
    'answer_id': '5777087420967766449',
    'from_answer_id': '5777087420967766449',
    'participant': {
      'id': '670968966872011405',
      'name': 'arbonenfant',
      'type': 'User'
    },
    'user': {
      'id': '670968966872011405',
      'login': 'arbonenfant',
      'first_name': 'Armelle',
      'last_name': 'Bonenfant'
    },
    'item': {
      'id': '6379723280369399253',
      'type': 'Task',
      'string': {
        'title': 'Blockly Basic Task'
      }
    },
    'can_watch_answer': true
  },
];

test('checks reload link in logs on task page', async ({ page }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('/a/6379723280369399253;p=7523720120450464843;a=0/progress/history'),
    page.waitForResponse(`${apiUrl}/items/6379723280369399253/log?limit=20`),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Blockly Basic Task' })).toBeVisible();
  const reloadAnswerLocator = page.getByRole('link', { name: 'Reload answer' }).first();
  await expect.soft(reloadAnswerLocator).toBeVisible();
  await Promise.all([
    reloadAnswerLocator.click(),
    expect.soft(page).toHaveURL(new RegExp('/a/6379723280369399253;p=7523720120450464843')),
  ]);
});

test('checks view link in logs on task page', async ({ page }) => {
  await initAsUsualUser(page);
  await Promise.all([
    page.goto('/a/6379723280369399253;p=7523720120450464843;a=0;og=123456/progress/history/'),
    page.waitForResponse(`${apiUrl}/items/6379723280369399253/log?limit=20&watched_group_id=123456`),
  ]);
  await expect.soft(page.getByRole('heading', { name: 'Blockly Basic Task' })).toBeVisible();
  const reloadAnswerLocator = page.getByRole('link', { name: 'View answer' }).first();
  await expect.soft(reloadAnswerLocator).toBeVisible();
  await Promise.all([
    reloadAnswerLocator.click(),
    expect.soft(page).toHaveURL(new RegExp('/a/6379723280369399253;p=7523720120450464843;answerId=')),
  ]);
});

test('checks reload link in logs on item page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/7523720120450464843;p=7528142386663912287;a=0/progress/history');
  await page.route(`${apiUrl}/items/7523720120450464843/log?limit=20`, async route => {
    await route.fulfill({ json: otherItemJson });
  });
  await expect.soft(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
  const reloadAnswerLocator = page.getByRole('link', { name: 'Reload answer' }).first();
  await expect.soft(reloadAnswerLocator).toBeVisible();
  await Promise.all([
    reloadAnswerLocator.click(),
    expect.soft(page).toHaveURL(new RegExp('/a/6379723280369399253')),
  ]);
});

test('checks view link in logs on item page', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('a/7523720120450464843;p=7528142386663912287;a=0;og=123456/progress/history');
  await page.route(`${apiUrl}/items/7523720120450464843/log?limit=20&watched_group_id=123456`, async route => {
    await route.fulfill({ json: otherItemJson });
  });
  await expect.soft(page.getByRole('heading', { name: 'Tasks Showcase' })).toBeVisible();
  const reloadAnswerLocator = page.getByRole('link', { name: 'View answer' }).first();
  await expect.soft(reloadAnswerLocator).toBeVisible();
  await Promise.all([
    reloadAnswerLocator.click(),
    expect(page).toHaveURL(new RegExp('/a/6379723280369399253;answerId=')),
  ]);
});
