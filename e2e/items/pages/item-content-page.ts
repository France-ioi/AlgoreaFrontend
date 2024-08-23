import { expect, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class ItemContentPage {
  descriptionLocator = this.page.getByTestId('item-description');
  chapterChildrenLocator = this.page.locator('alg-chapter-children');
  switchEditLocator = this.page.getByTestId('edit-switch');
  subSkillsLocator = this.page.locator('alg-sub-skills');
  parentSkillsLocator = this.page.locator('alg-parent-skills');
  itemChildrenEditListLocator = this.page.locator('alg-item-children-edit-list');
  itemChildrenEditFormLocator = this.page.locator('alg-item-children-edit-form');

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
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
      this.page.getByText('Your current access rights do not allow you to list the content of this chapter.')
    ).toBeVisible();
  }

  async checksIsPrerequisiteSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Prerequisites')).toBeVisible();
  }

  async checksIsPrerequisiteSectionNotVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Prerequisites')).not.toBeVisible();
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
    await expect.soft(this.page.getByText('Your current access rights do not allow you to start the activity.')).toBeVisible();
  }

  async checksSkillNoAccessMessageIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Your current access rights do not allow you to list the content of this skill.')).toBeVisible();
  }
}
