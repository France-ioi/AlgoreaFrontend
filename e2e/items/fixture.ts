import { test as base } from '@playwright/test';
import { ItemContentPage } from 'e2e/items/pages/item-content-page';

interface ItemFixtures {
  itemContentPage: ItemContentPage,
}

export const test = base.extend<ItemFixtures>({
  itemContentPage: async ({ page }, use) => {
    await use(new ItemContentPage(page));
  },
});

export { expect, Page } from '@playwright/test';
