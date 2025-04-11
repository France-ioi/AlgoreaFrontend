import { test } from './fixture';
import { initAsTesterUser } from 'e2e/helpers/e2e_auth';

test.beforeEach(async ({ page }) => {
  await initAsTesterUser(page);
});

test('checks edit advanced propagation with low item permissions', async ({
  page,
  itemChildrenEditListComponent,
  propagationAdvancedConfigurationDialogComponent,
}) => {
  await page.goto('a/7295161811890273703;p=;a=0;pa=0/edit-children');
  await itemChildrenEditListComponent.openPropagationMenu('Non-visible content (1684662381516509546)');
  await itemChildrenEditListComponent.openPropagationAdvancedConfigurationMenu();
  await propagationAdvancedConfigurationDialogComponent.checksIsTitleLocatorVisible();
  await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
    'Propagation of "content" view permission'
  );
  await propagationAdvancedConfigurationDialogComponent.hoverOnOptionValue(
    'Propagation of "content" view permission',
    'Info'
  );
  await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
    'You needs "Can grant view" to be at least "Info & enter"',
  );
});

// checks edit advanced propagation with low item permissions and high propagations by default
// Create child item with no permissions
// Save item
// Open advanced configuration modal
// Decrease propagations
// Save item
// Open advanced configuration modal
// Increase propagations
// Check errors
