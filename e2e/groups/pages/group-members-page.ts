import { Page, expect } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class GroupMembersPage {
  private navTabLocator = this.page.locator('.alg-nav-tab');
  private memberListLocator = this.page.locator('alg-member-list');
  private confirmationModalLocator = this.page.locator('alg-confirmation-modal');
  private approveConfirmationBtnLocator = this.confirmationModalLocator.getByRole('button', { name: 'Yes' });
  private rejectConfirmationBtnLocator = this.confirmationModalLocator.getByRole('button', { name: 'No' });

  constructor(private readonly page: Page) {
  }

  async checksIsHeaderVisible(groupName: string): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: groupName })).toBeVisible();
  }

  async goToTab(tab: string): Promise<void> {
    const tabLink = this.navTabLocator.getByRole('link', { name: tab });
    await expect.soft(tabLink).toBeVisible();
    await tabLink.click();
  }

  async checksIsGroupWithCheckboxVisible(groupName: string): Promise<void> {
    await expect.soft(this.memberListLocator.getByText(groupName)).toBeVisible();
    await expect.soft(
      this.page.getByRole('row', { name: groupName }).getByRole('checkbox')
    ).toBeVisible();
  }

  async switchCheckbox(groupName: string): Promise<void> {
    await this.page.getByRole('row', { name: groupName }).getByRole('checkbox').click();
  }

  async selectAllCheckboxes(): Promise<void> {
    const selectAll = this.page.getByTestId('member-list-select-all');
    await expect.soft(selectAll).toBeVisible();
    // Prefer check() so the native change handler runs and selection becomes non-empty.
    await selectAll.check();
  }

  async removeCheckedFromGroup(): Promise<void> {
    await expect.soft(
      this.page.getByRole('button', { name: 'Remove from group' })
    ).toBeVisible();
    await this.page.getByRole('button', { name: 'Remove from group' }).click();
  }

  /**
   * Empties the Users membership list when non-empty.
   * Required before group deletion: the settings delete button stays disabled while User children remain.
   */
  async removeAllMembersIfAny(groupId: string): Promise<void> {
    await this.page.goto(`/groups/by-id/${ groupId };p=/members`);
    await expect.soft(this.memberListLocator).toBeVisible();
    const emptyMessage = this.page.getByText('This group has no members.');
    const selectAll = this.page.getByTestId('member-list-select-all');
    await expect(emptyMessage.or(selectAll)).toBeVisible();
    if (!(await selectAll.isVisible())) return;

    await this.selectAllCheckboxes();
    // Footer-scoped role query: Phosphor icon glyphs pollute the accessible name, so exact 'Remove' fails.
    const removeBtn = this.memberListLocator.locator('.alg-table-footer').getByRole('button');
    await expect(removeBtn).toBeEnabled();
    await Promise.all([
      removeBtn.click(),
      this.page.waitForResponse(response =>
        response.url().includes(`/groups/${ groupId }/members`) && response.request().method() === 'DELETE'
      ),
    ]);
    await expect(emptyMessage).toBeVisible();
  }

  async checksIsDeleteConfirmationVisible(text: string | RegExp): Promise<void> {
    await expect.soft(this.confirmationModalLocator.getByText(text)).toBeVisible();
  }

  async checksIsDeleteConfirmationNotVisible(text: string | RegExp): Promise<void> {
    await expect.soft(this.confirmationModalLocator.getByText(text)).not.toBeVisible();
  }

  async approveConfirmation(): Promise<void> {
    await expect.soft(this.approveConfirmationBtnLocator).toBeVisible();
    await this.approveConfirmationBtnLocator.click();
  }

  async rejectConfirmation(): Promise<void> {
    await expect.soft(this.rejectConfirmationBtnLocator).toBeVisible();
    await this.rejectConfirmationBtnLocator.click();
  }

  async checksIsAddSubGroupsSectionVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Add subgroups')).toBeVisible();
  }

  async createChild(name: string): Promise<string | undefined> {
    const inputLocator = this.page.getByPlaceholder('Enter a title to create a new child');
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.fill(name);
    const classBtnLocator = this.page.locator('alg-add-content').getByText('Class');
    await expect.soft(classBtnLocator).toBeVisible();
    await classBtnLocator.click();
    const response = await this.page.waitForResponse(`${apiUrl}/groups`);
    await expect.soft(this.page.getByText('Group successfully added')).toBeVisible();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonResponse: { data: { id: string | undefined } | undefined } = await response.json();
    return jsonResponse.data?.id;
  }

  async inviteUser(login: string, groupId: string): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'Invitations' })).toBeVisible();
    const loginsInputLocator = this.page.getByRole('textbox', {
      name: 'logins of users to invite, separated by commas (e.g., login1, login2, ...)',
    });
    await expect.soft(loginsInputLocator).toBeVisible();
    await loginsInputLocator.fill(login);
    const inviteBtn = this.page.getByRole('button', { name: /^Invite$/ });
    // Wait until the form is ready (button enables after logins parse) before racing the POST.
    await expect(inviteBtn).toBeEnabled();
    await Promise.all([
      inviteBtn.click(),
      this.page.waitForResponse(`${apiUrl}/groups/${ groupId }/invitations`),
    ]);
    await expect.soft(this.page.locator('alg-message-info').getByText(`user(s) invited successfully: ${ login }`)).toBeVisible();
  }
}
