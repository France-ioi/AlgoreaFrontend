import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';

/**
 * Path-aware menu selection.
 *
 * Fixture: chapter `7765874445258315610` has a child whose id (`5917606193467920855`)
 * also appears as a sibling of `7765874445258315610` on the same parent chapter. The
 * same item id therefore exists at two different paths in the left nav tree.
 *
 * Without the fix:
 *  - Issue 1 (highlight): both occurrences of `5917606193467920855` would get the
 *    `.selected` class even though we only visited one of them.
 *  - Issue 2 (next/prev): pressing "next" from the first child of `7765874445258315610`
 *    would jump out of the chapter to the L1 sibling-of-T occurrence instead of
 *    landing on the next L2 child within T.
 */
test('next-from-first-child stays inside the chapter when the next id collides with a sibling', async ({ page }) => {
  await initAsUsualUser(page);
  await page.goto('/a/7765874445258315610;p=7528142386663912287,944619266928306927;a=0;pa=0');

  // This chapter uses the `List` children layout, so children are rendered by `alg-item-children-list`.
  const firstChildLink = page.locator('alg-item-children-list > ul > li:first-child > a');
  await expect(firstChildLink).toBeVisible();
  await firstChildLink.click();
  // The first child's URL must include 7765874445258315610 in the path (it is its parent).
  await expect(page).toHaveURL(/\/a\/\d+;p=7528142386663912287,944619266928306927,7765874445258315610/);

  await page.locator('alg-neighbor-widget').getByTestId('nav-to-next').click();

  await test.step('next lands on the L2-child occurrence (path includes the chapter)', async () => {
    await expect(page).toHaveURL(
      /\/a\/5917606193467920855;p=7528142386663912287,944619266928306927,7765874445258315610/,
    );
  });

  await test.step('only the L2 occurrence is highlighted in the left menu', async () => {
    const selected = page.locator('alg-left-nav-tree [data-selected="true"]');
    await expect.soft(selected).toHaveCount(1);
    // L2 nodes in the menu are rendered with a smaller `.children-caption` font; L1 nodes are not.
    // Asserting on this class confirms the selection is on the sub-child, not on the L1 sibling.
    await expect.soft(selected.locator('.children-caption')).toBeVisible();
  });
});
