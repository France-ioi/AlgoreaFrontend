import { LostChangesConfirmationModal } from 'e2e/common/pages/lost-changes-confirmation-modal';
import { Toast } from 'e2e/common/pages/toast';
import { test as groupFixtures } from '../groups/create-group-fixture';
import { test as itemFixtures } from '../items/create-item-fixture';
import { mergeTests } from '@playwright/test';
import { ShowOverflow } from 'e2e/common/pages/show-overflow';
import { LeftMenu } from 'e2e/common/pages/left-menu';

interface CommonFixtures {
  lostChangesConfirmationModal: LostChangesConfirmationModal,
  toast: Toast,
  showOverflow: ShowOverflow,
  leftMenu: LeftMenu,
}

export const test = mergeTests(groupFixtures, itemFixtures).extend<CommonFixtures>({
  lostChangesConfirmationModal: async ({ page }, use) => {
    await use(new LostChangesConfirmationModal(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },
  showOverflow: async ({ page }, use) => {
    await use(new ShowOverflow(page));
  },
  leftMenu: async ({ page }, use) => {
    await use(new LeftMenu(page));
  },
});

export { expect, Page } from '@playwright/test';
