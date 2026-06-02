import { test, expect } from '@playwright/test';
import { initAsUsualUser } from '../helpers/e2e_auth';
import {
  expectBackOnlyExpanded,
  expectPrevNextNav,
  neighborWidgetLocator,
} from '../helpers/neighbor-widget';

/**
 * Fixture on the test instance: chapter `6131116104421692153` has
 * `disable_children_prev_next_nav` enabled, so its children must not show prev/next
 * in the top bar (expanded back button only).
 *
 * The chapter itself still shows sibling prev/next among its parent's children.
 */
const CHAPTER_ID = '6131116104421692153';
const CHILD_ID = '11198754952186966';
const PATH_PREFIX = '4702,7528142386663912287,944619266928306927';

const chapterAmongSiblingsUrl = `/a/${CHAPTER_ID};p=${PATH_PREFIX};a=0;pa=0`;
const chapterUrl = `/a/${CHAPTER_ID};p=${PATH_PREFIX};a=0`;
const childUrl = `/a/${CHILD_ID};p=${PATH_PREFIX},${CHAPTER_ID};a=0`;

test.describe('chapter with disable_children_prev_next_nav', () => {
  test.beforeEach(async ({ page }) => {
    await initAsUsualUser(page);
  });

  test('on the chapter among siblings, shows back/prev/next with next highlighted', async ({ page }) => {
    await page.goto(chapterAmongSiblingsUrl);
    const widget = neighborWidgetLocator(page);
    await expect(widget).toBeVisible();

    await expectPrevNextNav(widget, { nextHighlighted: true });
  });

  test('on a child, shows expanded back only when landing directly', async ({ page }) => {
    await page.goto(childUrl);
    const widget = neighborWidgetLocator(page);
    await expect(widget).toBeVisible();

    await expectBackOnlyExpanded(widget);
  });

  test('on a child, shows expanded back only when navigating from the chapter', async ({ page }) => {
    await page.goto(chapterAmongSiblingsUrl);
    const widget = neighborWidgetLocator(page);
    await expect(widget).toBeVisible();
    await expectPrevNextNav(widget, { nextHighlighted: true });

    const childLink = page.locator(`alg-item-children-list a[href*="${CHILD_ID}"]`);
    await expect(childLink).toBeVisible();
    await childLink.click();
    await expect(page).toHaveURL(new RegExp(`/a/${CHILD_ID};p=${PATH_PREFIX},${CHAPTER_ID}`));

    // Allow prev/next leave animation + layout fallback to finish.
    await expectBackOnlyExpanded(widget);
  });

  test('on a child opened from chapter content URL, shows expanded back only', async ({ page }) => {
    await page.goto(chapterUrl);
    const widget = neighborWidgetLocator(page);
    await expect(widget).toBeVisible();

    const childLink = page.locator(`alg-item-children-list a[href*="${CHILD_ID}"]`);
    await expect(childLink).toBeVisible();
    await childLink.click();
    await expect(page).toHaveURL(new RegExp(`/a/${CHILD_ID};p=${PATH_PREFIX},${CHAPTER_ID}`));

    await expectBackOnlyExpanded(widget);
  });
});
