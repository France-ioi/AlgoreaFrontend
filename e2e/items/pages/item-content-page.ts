import { expect, FrameLocator, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class ItemContentPage {
  titleLocator = this.page.getByTestId('item-title');
  descriptionLocator = this.page.getByTestId('item-description');
  // Item descriptions render inside a sandboxed iframe; text matchers must cross the frame boundary.
  descriptionFrameLocator: FrameLocator = this.page.locator('[data-testid=item-description] iframe').contentFrame();
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
  explicitEntryLocator = this.page.locator('alg-explicit-entry');

  constructor(private readonly page: Page) {
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async checksIsTitleVisible(title: string): Promise<void> {
    await expect.soft(this.titleLocator.filter({ hasText: title })).toBeVisible();
  }

  async checksIsDescriptionVisible(description: string): Promise<void> {
    await expect.soft(this.descriptionLocator).toBeVisible();
    await expect.soft(this.descriptionFrameLocator.getByText(description)).toBeVisible();
  }

  async checksIsDescriptionSectionNotVisible(): Promise<void> {
    await expect.soft(this.descriptionLocator).not.toBeVisible();
  }

  async waitForItemResponse(itemId: string): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}`);
  }

  async waitForNavigationResponse(itemId: string, paramsString = 'attempt_id=0'): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/items/${itemId}/navigation?${ paramsString }`);
  }

  /** Waits for the primary GET /items/{id} response after a left-nav selection (not sub-resources). */
  async waitForPrimaryItemResponse(): Promise<void> {
    await this.page.waitForResponse(response =>
      response.request().method() === 'GET' &&
      /\/items\/\d+(\?.*)?$/.test(response.url()) &&
      !response.url().includes('/navigation') &&
      !response.url().includes('/children') &&
      !response.url().includes('/breadcrumbs') &&
      !response.url().includes('/attempts') &&
      response.ok()
    );
  }

  async clickNavItemAndWaitForTitle(title: string): Promise<void> {
    const targetItemLocator = this.page.locator('cdk-nested-tree-node').getByText(title).first();
    await expect(targetItemLocator).toBeVisible();
    await Promise.all([
      targetItemLocator.click(),
      this.waitForPrimaryItemResponse(),
    ]);
    await expect(this.titleLocator).toHaveText(title);
  }

  async openParametersTab(): Promise<void> {
    const parametersTabLocator = this.page.getByRole('link', { name: 'Parameters' });
    await expect(parametersTabLocator).toBeVisible();
    await parametersTabLocator.click();
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

  async checksIsLoginWallVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Access hundreds of learning activities for free')).toBeVisible();
    await expect.soft(this.page.getByText('Sign up or Log in')).toBeVisible();
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
    await expect.soft(this.explicitEntryLocator).toBeVisible();
  }

  async checksOwnerManualEntryGateVisible(options?: { withEditChildrenPhrase?: boolean }): Promise<void> {
    const withEditChildren = options?.withEditChildrenPhrase ?? true;
    const entry = this.explicitEntryLocator;
    await expect.soft(entry).toBeVisible();
    if (withEditChildren) {
      await expect.soft(entry.getByText('This content requires manual entry (including for editing children).')).toBeVisible();
    } else {
      await expect.soft(entry.getByText('This content requires manual entry.', { exact: true })).toBeVisible();
    }
    // Button accessible name appends the Phosphor icon glyph; do not use exact: true.
    await expect.soft(entry.getByRole('button', { name: 'Start this activity' })).toBeVisible();
  }

  async checksRegularEnterNotAllowedVisible(): Promise<void> {
    const entry = this.explicitEntryLocator;
    await expect.soft(entry.getByText('You are not allowed to start the activity for now.')).toBeVisible();
    await expect.soft(entry.getByRole('button', { name: 'Enter now' })).toBeDisabled();
  }

  async checksAlreadyStartedAdviceVisible(): Promise<void> {
    const entry = this.explicitEntryLocator;
    await expect.soft(entry.getByText(/You have already started the activity/)).toBeVisible();
    await expect.soft(entry.getByRole('button', { name: 'Enter now' })).toBeDisabled();
  }

  async clickStartThisActivity(): Promise<void> {
    await this.explicitEntryLocator.getByRole('button', { name: 'Start this activity' }).click();
  }

  async openContentTab(): Promise<void> {
    const contentTabLocator = this.page.getByRole('link', { name: 'Content' });
    await expect(contentTabLocator).toBeVisible();
    await contentTabLocator.click();
  }

  async openAttemptsTab(): Promise<void> {
    const attemptsTabLocator = this.page.getByRole('link', { name: 'Attempts' });
    await expect(attemptsTabLocator).toBeVisible();
    await attemptsTabLocator.click();
  }

  async enableAllowMultipleAttemptsAndSave(): Promise<void> {
    const switchLocator = this.page.getByTestId('allow-multiple-attempts').locator('alg-switch');
    await expect(switchLocator).toBeVisible();
    await switchLocator.click();
    await this.saveChangesAndCheckNotification();
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
    const toastLocator = this.page.locator('alg-toast-messages');
    const successfulLocator = toastLocator.getByText(message);
    await expect.soft(successfulLocator).toBeVisible();
    // Best-effort cleanup: try to close the toast so the next assertion sees a clean state.
    // Toasts auto-dismiss after 5s (DISPLAY_DURATION in MessageService), so on a slow CI runner
    // the close button may already be gone by the time we try to click it; don't fail the test
    // on that — the next `not.toBeVisible()` assertion is the real post-condition.
    await toastLocator.getByRole('button').click({ timeout: 1000 }).catch(() => undefined);
    // Pause-on-hover: if the click missed, leave the toast so auto-dismiss can still fire.
    await this.page.mouse.move(0, 0).catch(() => undefined);
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
    // Prefer the type card button (accessible name includes title; description may follow).
    // Fall back to exact title text for short labels like "Chapter".
    const typeButton = this.page.locator('alg-add-content').getByRole('button', { name: type });
    if (await typeButton.count() > 0) {
      await expect.soft(typeButton.first()).toBeVisible();
      await typeButton.first().click();
      return;
    }
    // Exact match: "Chapter" must not also match "Chapter with manual participation".
    const classBtnLocator = this.page.locator('alg-add-content').getByText(type, { exact: true });
    await expect.soft(classBtnLocator).toBeVisible();
    await classBtnLocator.click();
  }

  async createChildItem(name: string, type = 'Chapter'): Promise<string | undefined> {
    await this.addChildItem(name, type);
    await this.isSaveBtnVisible();
    // Set up the response listener BEFORE the click so we never miss the response if the API
    // happens to answer faster than the next microtask.
    const responsePromise = this.page.waitForResponse(`${apiUrl}/items`);
    await this.saveChanges();
    const response = await responsePromise;
    // No toast assertion here — this is a fixture path. The successful API response is the proof
    // of save; toasts auto-dismiss after 5s and asserting on them races with that timer on slow
    // CI runners (see also `checkToastNotification`). Tests that explicitly cover the toast UX
    // do their own assertion via `saveChangesAndCheckNotification`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse: { data: { id: string | undefined } | undefined } = await response.json();
    return jsonResponse.data?.id;
  }

  async checksIsDeleteButtonVisible(): Promise<void> {
    await expect.soft(this.deleteItemBtnLocator).toBeVisible();
  }

  async waitForDeleteButtonReady(): Promise<void> {
    // Wait until the children check finishes (loading spinner gone). The button may still be
    // disabled afterward if the item cannot be deleted (e.g. non-empty chapter).
    await expect.poll(async () => !(await this.page.locator('alg-item-remove-button alg-loading').isVisible())).toBe(true);
  }

  async waitForDeleteButtonEnabled(): Promise<void> {
    await this.waitForDeleteButtonReady();
    await expect.poll(async () => this.deleteItemBtnLocator.isEnabled()).toBe(true);
  }

  async isDeleteButtonEnabled(): Promise<boolean> {
    return this.deleteItemBtnLocator.isEnabled();
  }

  async deleteItem(): Promise<void> {
    await this.waitForDeleteButtonEnabled();
    await this.deleteItemBtnLocator.click();
    await expect.soft(this.page.getByText('Are you sure you want to delete this content?')).toBeVisible();
    const confirmBtnLocator = this.page.getByRole('button', { name: 'Yes' });
    await expect.soft(confirmBtnLocator).toBeVisible();
    // Set up the response listener BEFORE the click so we never miss the response if the API
    // happens to answer faster than the next microtask.
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'DELETE' && /\/items\/\d+(?:\?.*)?$/.test(response.url())
    );
    await confirmBtnLocator.click();
    await responsePromise;
  }

  async checksIsAllowToViewMessageNotVisible(): Promise<void> {
    await expect.soft(this.page.getByText('This content does not exist or you are not allowed to view it.')).toBeVisible();
  }
}
