import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import { apiUrl } from '../helpers/e2e_http';

const currentUserLogsJson = [
  {
    "at": "2024-02-26T13:20:05Z",
    "activity_type": "submission",
    "attempt_id": "0",
    "answer_id": "6216264238928088073",
    "from_answer_id": "6216264238928088073",
    "score": 100,
    "participant": {
      "id": "670968966872011405",
      "name": "arbonenfant",
      "type": "User"
    },
    "user": {
      "id": "670968966872011405",
      "login": "arbonenfant",
      "first_name": "Armelle",
      "last_name": "Bonenfant"
    },
    "item": {
      "id": "1907925541868462206",
      "type": "Task",
      "string": {
        "title": "Task with edit tab"
      }
    },
    "can_watch_answer": true
  },
];

const otherUserJson = [
  {
    "at": "2024-02-06T14:25:29Z",
    "activity_type": "saved_answer",
    "attempt_id": "0",
    "answer_id": "113722894726386992",
    "from_answer_id": "113722894726386992",
    "participant": {
      "id": "752024252804317630",
      "name": "usr_5p020x2thuyu",
      "type": "User"
    },
    "user": {
      "id": "752024252804317630",
      "login": "usr_5p020x2thuyu"
    },
    "item": {
      "id": "6379723280369399253",
      "type": "Task",
      "string": {
        "title": "Blockly Basic Task"
      }
    },
    "can_watch_answer": true
  },
];

const groupLogsJson = [
  {
    "at": "2024-02-26T13:20:05Z",
    "activity_type": "submission",
    "attempt_id": "0",
    "answer_id": "6216264238928088073",
    "from_answer_id": "6216264238928088073",
    "score": 100,
    "participant": {
      "id": "670968966872011405",
      "name": "arbonenfant",
      "type": "User"
    },
    "user": {
      "id": "670968966872011405",
      "login": "arbonenfant",
      "first_name": "Armelle",
      "last_name": "Bonenfant"
    },
    "item": {
      "id": "1907925541868462206",
      "type": "Task",
      "string": {
        "title": "Task with edit tab"
      }
    },
    "can_watch_answer": true
  },
];

const itemLogsJson = [
  {
    "at": "2024-02-26T13:20:02Z",
    "activity_type": "submission",
    "attempt_id": "0",
    "answer_id": "5411327956377196984",
    "from_answer_id": "5411327956377196984",
    "score": 100,
    "participant": {
      "id": "670968966872011405",
      "name": "arbonenfant",
      "type": "User"
    },
    "user": {
      "id": "670968966872011405",
      "login": "arbonenfant",
      "first_name": "Armelle",
      "last_name": "Bonenfant"
    },
    "item": {
      "id": "1907925541868462206",
      "type": "Task",
      "string": {
        "title": "Task with edit tab"
      }
    },
    "can_watch_answer": true
  },
];

test('View answer in logs for current user', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/log?limit=20`, async route => {
    await route.fulfill({ json: currentUserLogsJson });
  });
  await page.goto('/groups/users/670968966872011405');
  await expect.soft(page.locator('h1').getByText('Armelle Bonenfant (arbonenfant)')).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'View answer' })).toBeVisible();
  await page.getByRole('link', { name: 'View answer' }).click();
  await expect.soft(page.locator('h1').getByText('Task with edit tab')).toBeVisible();
  await expect.soft(page).toHaveURL(/answerId=6216264238928088073/);
});

test('View answer in logs for other user', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/log?limit=20&watched_group_id=752024252804317630`, async route => {
    await route.fulfill({ json: otherUserJson });
  });
  await page.goto('/groups/users/752024252804317630');
  await expect.soft(page.locator('h1').getByText('usr_5p020x2thuyu')).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'View answer' })).toBeVisible();
  await page.getByRole('link', { name: 'View answer' }).click();
  await expect.soft(page.locator('h1').getByText('Blockly Basic Task')).toBeVisible();
  await expect.soft(page).toHaveURL(/answerId=113722894726386992/);
});

test('View answer in logs for a group', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/log?limit=20&watched_group_id=672913018859223173`, async route => {
    await route.fulfill({ json: groupLogsJson });
  });
  await page.goto('/groups/by-id/672913018859223173;p=52767158366271444/history');
  await expect.soft(page.locator('h1').getByText('Pixal')).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'View answer' })).toBeVisible();
  await page.getByRole('link', { name: 'View answer' }).click();
  await expect.soft(page.locator('h1').getByText('Task with edit tab')).toBeVisible();
  await expect.soft(page).toHaveURL(/answerId=6216264238928088073/);
});

test('Reload answer in logs for a item', async ({ page }) => {
  await initAsUsualUser(page);
  await page.route(`${apiUrl}/items/4702/log?limit=20`, async route => {
    await route.fulfill({ json: itemLogsJson });
  });
  await page.goto('/a/home;pa=0/progress/history');
  await expect.soft(page.locator('h1').getByText('Parcours officiels')).toBeVisible();
  await expect.soft(page.getByRole('link', { name: 'Reload answer' })).toBeVisible();
  await page.getByRole('link', { name: 'Reload answer' }).click();
  await expect.soft(page.locator('h1').getByText('Task with edit tab')).toBeVisible();
  await expect.soft(page).not.toHaveURL(/answerId=/);
});
