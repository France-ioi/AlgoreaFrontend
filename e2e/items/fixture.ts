import { test as base } from '@playwright/test';
import { ItemContentPage } from 'e2e/items/pages/item-content-page';
import { EditPermissionsModal } from 'e2e/items/pages/edit-permissions-modal';

interface ItemFixtures {
  itemContentPage: ItemContentPage,
  editPermissionsModal: EditPermissionsModal,
}

export const test = base.extend<ItemFixtures>({
  itemContentPage: async ({ page }, use) => {
    await use(new ItemContentPage(page));
  },
  editPermissionsModal: async ({ page }, use) => {
    await use(new EditPermissionsModal(page));
  },
});

export { expect, Page } from '@playwright/test';
