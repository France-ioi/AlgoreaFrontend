import { expect, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class ItemContentPage {
  titleLocator = this.page.getByTestId('item-title');
  descriptionLocator = this.page.getByTestId('item-description');
  chapterChildrenLocator = this.page.locator('alg-chapter-children');
  switchEditLocator = this.page.getByTestId('edit-switch');
  subSkillsLocator = this.page.locator('alg-sub-skills');
  parentSkillsLocator = this.page.locator('alg-parent-skills');
  itemChildrenEditListLocator = this.page.locator('alg-item-children-edit-list');
  itemChildrenEditFormLocator = this.page.locator('alg-item-children-edit-form');
  saveBtnLocator = this.page.getByRole('button', { name: 'Save' });
  cancelBtnLocator = this.page.getByRole('button', { name: 'Cancel' });
  addItemLocator = this.page.locator('alg-add-item').filter({ hasText: 'Add a content' });
  deleteItemBtnLocator = this.page.getByRole('button', { name: 'Delete this item' });

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checksIsTitleVisible(title: string): Promise<void> {
    await expect.soft(this.titleLocator.filter({ hasText: title })).toBeVisible();
  }

  async checksIsDescriptionVisible(description: string): Promise<void> {
    await expect.soft(this.descriptionLocator.filter({ hasText: description })).toBeVisible();
  }

  async checksIsDescriptionSectionNotVisible(): Promise<void> {
    await expect.soft(this.descriptionLocator).not.toBeVisible();
  }

  async waitForItemResponse(itemId: string): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}`);
  }

  async waitForBreadcrumbsResponse(itemId: string, paramsString = 'attempt_id=0'): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}/breadcrumbs?${ paramsString }`);
  }

  async waitForChildrenResponse(itemId: string, paramsString = 'attempt_id=0'): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}/children?${ paramsString }`);
  }

  async waitForAttemptsResponse(itemId: string, paramsString = 'attempt_id=0'): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}/attempts?${ paramsString }`);
  }

  async checksIsChapterChildrenSectionVisible(): Promise<void> {
    await expect.soft(this.chapterChildrenLocator).toBeVisible();
  }

  async checksIsChapterChildrenSectionNotVisible(): Promise<void> {
    await expect.soft(this.chapterChildrenLocator).not.toBeVisible();
  }

  async checksIsChapterChildVisible(title: string): Promise<void> {
    await expect.soft(this.chapterChildrenLocator.filter({ has: this.page.getByText(title) })).toBeVisible();
  }

  async checksIsSwitchEditVisible(): Promise<void> {
    await expect.soft(this.switchEditLocator).toBeVisible();
  }

  async checksIsSubSkillsSectionVisible(): Promise<void> {
    await expect.soft(this.subSkillsLocator).toBeVisible();
  }

  async checksIsSubSkillsSectionNotVisible(): Promise<void> {
    await expect.soft(this.subSkillsLocator).not.toBeVisible();
  }

  async checksIsParentSkillsSectionVisible(): Promise<void> {
    await expect.soft(this.parentSkillsLocator).toBeVisible();
  }

  async checksIsParentSkillsSectionNotVisible(): Promise<void> {
    await expect.soft(this.parentSkillsLocator).not.toBeVisible();
  }

  async checksIsSubParentSkillsSectionVisible(): Promise<void> {
    await this.checksIsSubSkillsSectionVisible();
    await this.checksIsParentSkillsSectionVisible();
  }

  async checksIsSubParentSkillsSectionNotVisible(): Promise<void> {
    await this.checksIsSubSkillsSectionNotVisible();
    await this.checksIsParentSkillsSectionNotVisible();
  }

  async checksIsItemChildrenEditListVisible(): Promise<void> {
    await expect.soft(this.itemChildrenEditListLocator).toBeVisible();
  }

  async checksIsItemChildrenEditListNotVisible(): Promise<void> {
    await expect.soft(this.itemChildrenEditListLocator).not.toBeVisible();
  }

  async checksNoEditPermissionMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('You do not have the permissions to edit this content.')).toBeVisible();
  }

  async checksIsItemChildrenEditFormVisible(): Promise<void> {
    await expect.soft(this.itemChildrenEditFormLocator).toBeVisible();
  }

  async checksIsChapterNoAccessMessageVisible(): Promise<void> {
    await expect.soft(
      this.page.getByText('You are not connected and cannot access the content of this chapter.')
    ).toBeVisible();
    await expect.soft(
      this.page.getByText('Please sign up or log in using the power button at the top right corner of this screen.')
    ).toBeVisible();
  }

  async checksIsChapterLockedMessageVisible(): Promise<void> {
    await expect.soft(this.page.getByText('This chapter is locked.')).toBeVisible();
    await expect.soft(this.page.getByText('Fulfill one of the prerequisites below to access its content.')).toBeVisible();
  }

  async checksIsPrerequisiteSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Prerequisites' })).toBeVisible();
  }

  async checksIsPrerequisiteSectionNotVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Prerequisites' })).not.toBeVisible();
  }

  async checksExplicitEntryIsVisible(): Promise<void> {
    await expect.soft(this.page.locator('alg-explicit-entry')).toBeVisible();
  }

  async checksTaskNotCorrectlyConfiguredMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('This activity has not been correctly configured.')).toBeVisible();
  }

  async checksTaskSetUrlMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('You need to set a url in editing mode.')).toBeVisible();
  }

  async checksLoadingContentMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Loading the content')).toBeVisible();
  }

  async checksItemDisplayIsNotVisible(): Promise<void> {
    await expect.soft(this.page.locator('alg-item-display')).not.toBeVisible();
  }

  async checksItemDisplayHasZeroOpacity(): Promise<void> {
    await expect.soft(this.page.locator('alg-item-display')).toHaveCSS('opacity', '0');
  }

  async checksTaskNoAccessMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Your current access rights do not allow you')).toBeVisible();
    await expect.soft(this.page.getByText('to start the activity.')).toBeVisible();
  }

  async checksSkillNoAccessMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Your current access rights do not allow you')).toBeVisible();
    await expect.soft(this.page.getByText('to list the content of this skill.')).toBeVisible();
  }

  async checkToastNotification(message: string): Promise<void> {
    const toastLocator = this.page.locator('p-toast');
    const successfulLocator = toastLocator.getByText(message);
    await expect.soft(successfulLocator).toBeVisible();
    await expect.soft(toastLocator.getByLabel('Close')).toBeVisible();
    await toastLocator.getByLabel('Close').click();
    await expect.soft(successfulLocator).not.toBeVisible();
  }

  async isSaveBtnVisible(): Promise<boolean> {
    return this.saveBtnLocator.isVisible();
  }

  async saveChanges(): Promise<void> {
    await expect.soft(this.saveBtnLocator).toBeVisible();
    await expect.soft(this.saveBtnLocator).toBeEnabled();
    await this.saveBtnLocator.click();
  }

  async saveChangesAndCheckNotification(): Promise<void> {
    await this.saveChanges();
    await this.checkToastNotification('Changes successfully saved.');
  }

  async cancelChanges(): Promise<void> {
    await expect.soft(this.cancelBtnLocator).toBeVisible();
    await this.cancelBtnLocator.click();
  }

  async checksIsAddContentVisible(): Promise<void> {
    await expect.soft(this.addItemLocator).toBeVisible();
  }

  async addChildItem(name: string, type = 'Chapter'): Promise<void> {
    const inputLocator = this.page.getByPlaceholder('Enter a title to create a new child');
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.fill(name);
    const classBtnLocator = this.page.locator('alg-add-content').getByText(type);
    await expect.soft(classBtnLocator).toBeVisible();
    await classBtnLocator.click();
  }

  async createChildItem(name: string, type = 'Chapter'): Promise<string | undefined> {
    await this.addChildItem(name, type);
    await this.isSaveBtnVisible();
    await this.saveChanges();
    const response = await this.page.waitForResponse(`${apiUrl}/items`);
    await this.checkToastNotification('Changes successfully saved.');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse: { data: { id: string | undefined } | undefined } = await response.json();
    return jsonResponse.data?.id;
  }

  async checksIsDeleteButtonVisible(): Promise<void> {
    await expect.soft(this.deleteItemBtnLocator).toBeVisible();
  }

  async deleteItem(): Promise<void> {
    await this.deleteItemBtnLocator.click();
    await expect.soft(this.page.getByText('Are you sure you want to delete this content?')).toBeVisible();
    const confirmBtnLocator = this.page.getByRole('button', { name: 'Yes' });
    await expect.soft(confirmBtnLocator).toBeVisible();
    await confirmBtnLocator.click();
  }

  async checksIsAllowToViewMessageNotVisible(): Promise<void> {
    await expect.soft(this.page.getByText('This content does not exist or you are not allowed to view it.')).toBeVisible();
  }
}
