import { test as base } from '@playwright/test';
import { ItemContentPage } from 'e2e/items/pages/item-content-page';
import { EditPermissionsModal } from 'e2e/items/pages/edit-permissions-modal';
import { ItemPermissionsComponent } from 'e2e/items/pages/item-permissions-component';
import { ItemChildrenEditListComponent } from 'e2e/items/pages/item-children-edit-list-component';
import { PropagationAdvancedConfigurationDialogComponent } from 'e2e/items/pages/propagation-advanced-configuration-dialog-component';

interface ItemFixtures {
  itemContentPage: ItemContentPage,
  editPermissionsModal: EditPermissionsModal,
  itemPermissionsComponent: ItemPermissionsComponent,
  itemChildrenEditListComponent: ItemChildrenEditListComponent,
  propagationAdvancedConfigurationDialogComponent: PropagationAdvancedConfigurationDialogComponent,
}

export const test = base.extend<ItemFixtures>({
  itemContentPage: async ({ page }, use) => {
    await use(new ItemContentPage(page));
  },
  editPermissionsModal: async ({ page }, use) => {
    await use(new EditPermissionsModal(page));
  },
  itemPermissionsComponent: async ({ page }, use) => {
    await use(new ItemPermissionsComponent(page));
  },
  itemChildrenEditListComponent: async ({ page }, use) => {
    await use(new ItemChildrenEditListComponent(page));
  },
  propagationAdvancedConfigurationDialogComponent: async ({ page }, use) => {
    await use(new PropagationAdvancedConfigurationDialogComponent(page));
  },
});

export { expect, Page } from '@playwright/test';
