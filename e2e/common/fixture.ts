import { test as base } from '@playwright/test';
import { LostChangesConfirmationModal } from 'e2e/common/pages/lost-changes-confirmation-modal';

interface CommonFixtures {
  lostChangesConfirmationModal: LostChangesConfirmationModal,
}

export const test = base.extend<CommonFixtures>({
  lostChangesConfirmationModal: async ({ page }, use) => {
    await use(new LostChangesConfirmationModal(page));
  },
});

export { expect, Page } from '@playwright/test';
