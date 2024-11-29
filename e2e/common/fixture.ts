import { LostChangesConfirmationModal } from 'e2e/common/pages/lost-changes-confirmation-modal';
import { Toast } from 'e2e/common/pages/toast';
import { test as groupFixtures } from '../groups/create-group-fixture';
import { test as itemFixtures } from '../items/create-item-fixture';
import { mergeTests } from '@playwright/test';
import { Header } from 'e2e/common/pages/header';
import { ShowOverflow } from 'e2e/common/pages/show-overflow';

interface CommonFixtures {
  lostChangesConfirmationModal: LostChangesConfirmationModal,
  toast: Toast,
  header: Header,
  showOverflow: ShowOverflow,
}

export const test = mergeTests(groupFixtures, itemFixtures).extend<CommonFixtures>({
  lostChangesConfirmationModal: async ({ page }, use) => {
    await use(new LostChangesConfirmationModal(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  showOverflow: async ({ page }, use) => {
    await use(new ShowOverflow(page));
  },
});

export { expect, Page } from '@playwright/test';
