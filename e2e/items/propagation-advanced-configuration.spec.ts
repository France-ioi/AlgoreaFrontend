import { test } from './fixture';
import { initAsTesterUser, initAsUsualUser } from 'e2e/helpers/e2e_auth';
import { expect } from '@playwright/test';

test('checks edit advanced propagation full flow', { tag: '@no-parallelism' }, async ({
  page,
  itemChildrenEditListComponent,
  propagationAdvancedConfigurationDialogComponent,
  editPermissionsModal,
  itemContentPage,
}) => {
  await test.step('enables full item permissions', async () => {
    await initAsUsualUser(page);
    await page.goto('/a/7953920074421401798;p=8494219788300407657;a=0?watchedGroupId=8381064573926674105');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();
    await editPermissionsModal.openField('Can view');
    await editPermissionsModal.selectOption('Can view', 'Solution');
    await editPermissionsModal.openField('Can grant view');
    await editPermissionsModal.selectOption('Can grant view', 'Solution and grant');
    await editPermissionsModal.openField('Can watch');
    await editPermissionsModal.selectOption('Can watch', 'Answer and grant');
    await editPermissionsModal.openField('Can edit');
    await editPermissionsModal.selectOption('Can edit', 'All and grant');
    await editPermissionsModal.savePermissions();
    await editPermissionsModal.checksIsPermissionsModalNotVisible();
  });

  await test.step('selects full item propagations', async () => {
    await initAsTesterUser(page);
    await page.goto('a/8494219788300407657;p=;a=0;pa=0/edit-children');
    await expect.soft(page.getByTestId('item-title')).toHaveText('E2EPropagationChapter');
    await itemChildrenEditListComponent.openPropagationMenu('E2EPropagationItem');
    await itemChildrenEditListComponent.openPropagationAdvancedConfigurationMenu();
    await propagationAdvancedConfigurationDialogComponent.checksIsTitleLocatorVisible();
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "content" view permission',
    );
    await propagationAdvancedConfigurationDialogComponent.selectOptionValue(
      'Propagation of "content" view permission',
      'Content',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of higher view permission',
    );
    await propagationAdvancedConfigurationDialogComponent.selectOptionValue(
      'Propagation of higher view permission',
      'Solution',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "grant view" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "grant view" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "watch" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "watch" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "edit" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "edit" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.isProceedBtnEnabled();
    await propagationAdvancedConfigurationDialogComponent.savePermissions();
    await itemContentPage.saveChanges();
  });

  await test.step('decrease item permissions', async () => {
    await initAsUsualUser(page);
    await page.goto('/a/7953920074421401798;p=8494219788300407657;a=0?watchedGroupId=8381064573926674105');
    await editPermissionsModal.openPermissionsBlock();
    await editPermissionsModal.openPermissionsModal();

    await editPermissionsModal.openField('Can edit');
    await editPermissionsModal.selectOption('Can edit', 'Nothing');

    await editPermissionsModal.openField('Can watch');
    await editPermissionsModal.selectOption('Can watch', 'Nothing');

    await editPermissionsModal.openField('Can grant view');
    await editPermissionsModal.selectOption('Can grant view', 'Nothing');

    await editPermissionsModal.openField('Can view');
    await editPermissionsModal.selectOption('Can view', 'Content');


    await editPermissionsModal.savePermissions();
    await editPermissionsModal.checksIsPermissionsModalNotVisible();
  });

  await test.step('decrease item propagations', async () => {
    await initAsTesterUser(page);
    await page.goto('a/8494219788300407657;p=;a=0;pa=0/edit-children');
    await expect.soft(page.getByTestId('item-title')).toHaveText('E2EPropagationChapter');
    await itemChildrenEditListComponent.openPropagationMenu('E2EPropagationItem');
    await itemChildrenEditListComponent.openPropagationAdvancedConfigurationMenu();
    await propagationAdvancedConfigurationDialogComponent.checksIsTitleLocatorVisible();
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "content" view permission',
    );
    await propagationAdvancedConfigurationDialogComponent.selectOptionValue(
      'Propagation of "content" view permission',
      'None',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of higher view permission',
    );
    await propagationAdvancedConfigurationDialogComponent.selectOptionValue(
      'Propagation of higher view permission',
      'Use \'content\' propagation',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "grant view" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "grant view" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "watch" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "watch" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "edit" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.switchBooleanValue(
      'Propagation of "edit" permission'
    );
    await propagationAdvancedConfigurationDialogComponent.isProceedBtnEnabled();
    await propagationAdvancedConfigurationDialogComponent.savePermissions();
    await itemContentPage.saveChanges();
  });

  await test.step('checks disabled item propagations', async () => {
    await initAsTesterUser(page);
    await page.goto('a/8494219788300407657;p=;a=0;pa=0/edit-children');
    await expect.soft(page.getByTestId('item-title')).toHaveText('E2EPropagationChapter');
    await itemChildrenEditListComponent.openPropagationMenu('E2EPropagationItem');
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
    await propagationAdvancedConfigurationDialogComponent.hoverOnOptionValue(
      'Propagation of "content" view permission',
      'Content'
    );
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can grant view" to be at least "Content"',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "content" view permission'
    );

    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of higher view permission',
    );
    await propagationAdvancedConfigurationDialogComponent.hoverOnOptionValue(
      'Propagation of higher view permission',
      'Content with descendants'
    );
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can grant view" to be at least "Content and descendants"',
    );
    await propagationAdvancedConfigurationDialogComponent.hoverOnOptionValue(
      'Propagation of higher view permission',
      'Solution'
    );
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can grant view" to be at least "Solution"',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of higher view permission',
    );

    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "grant view" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.hoverOnSwitchValue('Propagation of "grant view" permission');
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can grant view" to be at least "Solution and grant"',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "grant view" permission',
    );

    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "watch" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.hoverOnSwitchValue('Propagation of "watch" permission');
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can watch" to be at least "Answer and grant"',
    );
    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "watch" permission',
    );

    await propagationAdvancedConfigurationDialogComponent.toggleCollapsableSection(
      'Propagation of "edit" permission',
    );
    await propagationAdvancedConfigurationDialogComponent.hoverOnSwitchValue('Propagation of "edit" permission');
    await propagationAdvancedConfigurationDialogComponent.checkIsValidationTooltipVisible(
      'You needs "Can edit" to be at least "All and grant"',
    );
  });
});
