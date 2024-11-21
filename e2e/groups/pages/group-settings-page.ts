import { Page, expect } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class GroupSettingsPage {
  inputDateLocator = this.page.getByTestId('input-date').getByRole('textbox');
  saveBtnLocator = this.page.getByRole('button', { name: 'Save' });
  strengthenedConfirmationMessageLocator
    = this.page.getByText('As you have strengthened approval conditions, all group members have to re-approve the new conditions');
  strengthenedConfirmationCancelBtnLocator = this.page.getByRole('button', { name: 'Cancel', exact: true });
  deleteGroupBtnLocator = this.page.getByRole('button', { name: 'Delete this group' });
  associatedActivitySectionLocator = this.page.locator('alg-associated-item').filter({ hasText: 'Associated Activity' });
  searchExistingContentInputLocator = this.associatedActivitySectionLocator.getByPlaceholder('Search for existing content').nth(1);

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checkRequiredApprovalsSectionIsVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Required approvals' })).toBeVisible();
  }

  async enableLockMembershipUntilInputDate(): Promise<void> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(this.page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
    await this.page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(this.inputDateLocator).toBeVisible();
  }

  async disableLockMembershipUntilInputDate(): Promise<void> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    await expect.soft(this.page.getByTestId('switch-require-lock-until-enabled')).toBeVisible();
    await this.page.getByTestId('switch-require-lock-until-enabled').click();
    await expect.soft(this.page.getByTestId('input-date')).not.toBeVisible();
  }

  async fillDate(input: string): Promise<void> {
    await this.inputDateLocator.fill(input);
  }

  async selectManagersCanAccessMemberPersonalInformation(option: 'No' | 'Read only' | 'Read and edit'): Promise<void> {
    await expect.soft(this.page.getByText('Managers can access member\'s personal information')).toBeVisible();
    const requirePersonalInfoAccessApprovalSelectionLocator
      = this.page.getByTestId('selection-control-value').filter({ hasText: option });
    await expect.soft(requirePersonalInfoAccessApprovalSelectionLocator).toBeVisible();
    await requirePersonalInfoAccessApprovalSelectionLocator.click();
  }

  async isLockMembershipInputDateVisible(): Promise<boolean> {
    await expect.soft(this.page.getByText('Lock membership until a given date')).toBeVisible();
    return this.page.getByTestId('input-date').isVisible();
  }

  async isManagersCanAccessMemberPersonalInformationSelected(option: 'No' | 'Read only' | 'Read and edit'): Promise<boolean> {
    const locator = this.page.locator('alg-selection').locator('li').filter({ hasText: option });
    return locator.evaluate(el => el.classList.contains('active'));
  }

  async checkIsStrengthenedApprovalConfirmationVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationMessageLocator).toBeVisible();
  }

  async checkIsStrengthenedApprovalConfirmationNotVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationMessageLocator).not.toBeVisible();
  }

  async checkIsStrengthenedConfirmationCancelBtnVisible(): Promise<void> {
    await expect.soft(this.strengthenedConfirmationCancelBtnLocator).toBeVisible();
  }

  async cancelStrengthenedConfirmation(): Promise<void> {
    await this.strengthenedConfirmationCancelBtnLocator.click();
    await this.checkIsStrengthenedApprovalConfirmationNotVisible();
  }

  async selectStrengthenedConfirmationOperation(
    operation: 'Cancel' | 'Remove all members' | 'Remove and re-invite all members'
  ): Promise<void> {
    await this.page.getByRole('button', { name: operation, exact: true }).click();
  }

  async isSaveBtnVisible(): Promise<boolean> {
    return this.saveBtnLocator.isVisible();
  }

  async checkSuccessfulNotification(): Promise<void> {
    const toastLocator = this.page.locator('p-toast');
    const successfulLocator = toastLocator.getByText('SuccessChanges successfully');
    await expect.soft(successfulLocator).toBeVisible();
    await expect.soft(toastLocator.getByLabel('Close')).toBeVisible();
    await toastLocator.getByLabel('Close').click();
    await expect.soft(successfulLocator).not.toBeVisible();
  }

  async saveChanges(): Promise<void> {
    await expect.soft(this.saveBtnLocator).toBeVisible();
    await expect.soft(this.saveBtnLocator).toBeEnabled();
    await this.saveBtnLocator.click();
  }

  async saveChangesAndCheckNotification(): Promise<void> {
    await this.saveChanges();
    await this.checkSuccessfulNotification();
  }

  async checksIsDeleteButtonVisible(): Promise<void> {
    await expect.soft(this.deleteGroupBtnLocator).toBeVisible();
  }

  async checksIsDeleteButtonEnabled(): Promise<void> {
    await expect.soft(this.deleteGroupBtnLocator).toBeEnabled();
  }

  async checksIsDeleteButtonDisabled(): Promise<void> {
    await expect.soft(this.deleteGroupBtnLocator).toBeDisabled();
  }

  async deleteGroup(): Promise<void> {
    await this.deleteGroupBtnLocator.click();
    await expect.soft(this.page.getByText('Confirm Action')).toBeVisible();
    const confirmBtnLocator = this.page.getByRole('button', { name: 'Delete it' });
    await expect.soft(confirmBtnLocator).toBeVisible();
    await confirmBtnLocator.click();
  }

  async checksIsAssociatedActivitySectionVisible(): Promise<void> {
    await expect.soft(this.associatedActivitySectionLocator).toBeVisible();
  }

  async checksIsAssociatedActivityVisible(name: string): Promise<void> {
    await expect.soft(this.associatedActivitySectionLocator.getByText(name)).toBeVisible();
  }

  async checksIsAssociatedActivitySearchInputVisible(): Promise<void> {
    await expect.soft(this.searchExistingContentInputLocator).toBeVisible();
  }

  async searchAndSelectAssociatedActivity(search: string): Promise<void> {
    await this.searchExistingContentInputLocator.fill(search);
    const foundItemLocator = this.page.locator('alg-add-content').getByRole('listitem').filter({
      has: this.page.getByText(search).first()
    });
    await expect.soft(foundItemLocator.getByRole('button', { name: 'Select' })).toBeVisible();
    await foundItemLocator.getByRole('button', { name: 'Select' }).click();
  }

  async checksIsSubtitleLoadingVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Associated activity: loading')).toBeVisible();
  }

  async checksIsSubtitleVisible(name: string): Promise<void> {
    await expect.soft(this.page.getByText(`Associated activity: ${name}`)).toBeVisible();
  }

  async checksIsSubtitleNotVisible(name: string): Promise<void> {
    await expect.soft(this.page.getByText(`Associated activity: ${name}`)).not.toBeVisible();
  }

  async waitForGroupResponse(groupId: string): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/groups/${groupId}`);
  }

  async abortOrContinueAssociatedItemResponse(itemId: string, errorCode?: string): Promise<void> {
    await this.page.route(`${apiUrl}/items/${itemId}`, route =>
      (errorCode === undefined ? route.continue() : errorCode === 'accessdenied' ? route.fulfill({
        status: 403,
      }) : route.abort())
    );
  }

  async navigateToAssociatedActivity(name: string): Promise<void> {
    await this.page.getByText(`Associated activity: ${name}`).getByRole('link', { name }).click();
  }

  async removeAssociatedActivity(): Promise<void> {
    await this.associatedActivitySectionLocator.getByRole('button').click();
  }

  async isNotAllowToViewMessageVisible(): Promise<void> {
    await expect.soft(this.page.getByText('You are not allowed to view this group page.')).toBeVisible();
  }

  async retrySubtitle(): Promise<void> {
    const retrySubtitleBtnLocator = this.page.getByTestId('retry-subtitle');
    await expect.soft(retrySubtitleBtnLocator).toBeVisible();
    await retrySubtitleBtnLocator.click();
  }
}
