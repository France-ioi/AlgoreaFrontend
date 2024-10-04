import { test, expect } from './fixture';
import { initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { apiUrl } from 'e2e/helpers/e2e_http';

test.skip('checks navigation to another tab for item', async ({ page, lostChangesConfirmationModal }) => {
  await initAsUsualUser(page);
  await test.step('checks cancel modal', async () => {
    await page.goto('a/39530140456452546;p=4702,4102,1980584647557587953;a=0/parameters');
    await page.waitForResponse(`${ apiUrl }/items/39530140456452546/attempts?attempt_id=0`);
    await expect.soft(page.getByText('Item Title')).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.getByRole('link', { name: 'Dependencies' }).click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.cancel();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByText('Item Title')).toBeVisible();
  });

  await test.step('checks confirm modal', async () => {
    await page.goto('a/39530140456452546;p=4702,4102,1980584647557587953;a=0/parameters');
    await page.waitForResponse(`${ apiUrl }/items/39530140456452546/attempts?attempt_id=0`);
    await expect.soft(page.getByText('Item Title')).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.getByRole('link', { name: 'Dependencies' }).click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.confirm();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: 'Prerequisites' })).toBeVisible();
    await expect.soft(page.getByText('Item Title')).not.toBeVisible();
  });
});

test.skip('checks navigation to another module for item', async ({ page, lostChangesConfirmationModal }) => {
  await initAsUsualUser(page);
  await test.step('checks cancel modal', async () => {
    await page.goto('a/39530140456452546;p=4702,4102,1980584647557587953;a=0/parameters');
    await page.waitForResponse(`${ apiUrl }/items/39530140456452546/attempts?attempt_id=0`);
    await expect.soft(page.getByText('Item Title')).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.locator('alg-left-nav').getByRole('button', { name: 'Groups' }).click();
    await page.waitForResponse(`${ apiUrl }/groups/roots`);
    await expect.soft(page.locator('#nav-4035378957038759250')).toBeVisible();
    await page.locator('#nav-4035378957038759250').click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.cancel();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByText('Item Title')).toBeVisible();
  });

  await test.step('checks confirm modal', async () => {
    await page.goto('a/39530140456452546;p=4702,4102,1980584647557587953;a=0/parameters');
    await page.waitForResponse(`${ apiUrl }/items/39530140456452546/attempts?attempt_id=0`);
    await expect.soft(page.getByText('Item Title')).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.locator('alg-left-nav').getByRole('button', { name: 'Groups' }).click();
    await page.waitForResponse(`${ apiUrl }/groups/roots`);
    await expect.soft(page.locator('#nav-4035378957038759250')).toBeVisible();
    await page.locator('#nav-4035378957038759250').click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.confirm();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
    await expect.soft(page.getByText('Item Title')).not.toBeVisible();
  });
});

test.skip('checks navigation to another tab for group', async ({ page, lostChangesConfirmationModal }) => {
  await initAsUsualUser(page);
  await test.step('checks cancel modal', async () => {
    await page.goto('groups/by-id/4035378957038759250;p=/settings');
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.getByRole('link', { name: 'Overview' }).click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.cancel();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
  });

  await test.step('checks confirm modal', async () => {
    await page.goto('groups/by-id/4035378957038759250;p=/settings');
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.getByRole('link', { name: 'Overview' }).click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.confirm();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: 'Presentation' })).toBeVisible();
    await expect.soft(page.getByText('Item Title')).not.toBeVisible();
  });
});

test.skip('checks navigation to another module for group', async ({ page, lostChangesConfirmationModal }) => {
  await initAsUsualUser(page);
  await test.step('checks cancel modal', async () => {
    await page.goto('groups/by-id/4035378957038759250;p=/settings');
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.locator('alg-left-nav').getByRole('button', { name: 'Content' }).click();
    await expect.soft(page.locator('#nav-4702')).toBeVisible();
    await page.locator('#nav-4702').click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.cancel();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
  });

  await test.step('checks confirm modal', async () => {
    await page.goto('groups/by-id/4035378957038759250;p=/settings');
    await expect.soft(page.getByRole('heading', { name: '!634' })).toBeVisible();
    await expect.soft(page.getByRole('textbox').nth(1)).toBeVisible();
    await page.getByRole('textbox').nth(1).fill('Some test');
    await page.locator('alg-left-nav').getByRole('button', { name: 'Content' }).click();
    await expect.soft(page.locator('#nav-4702')).toBeVisible();
    await page.locator('#nav-4702').click();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationVisible();
    await lostChangesConfirmationModal.confirm();
    await lostChangesConfirmationModal.checksIsLostChangesConfirmationNotVisible();
    await expect.soft(page.getByRole('heading', { name: 'Parcours officiels' })).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: '!634' })).not.toBeVisible();
  });
});
