import { expect, Page } from '@playwright/test';
import { apiUrl } from 'e2e/helpers/e2e_http';

export class MinePage {
  userGroupInvitationsLocator = this.page.locator('alg-user-group-invitations');

  constructor(private readonly page: Page) {
  }

  async goto(url = '/groups/mine'): Promise<void> {
    await this.page.goto(url);
  }

  async checkHeaderIsVisible(): Promise<void> {
    await expect.soft(this.page.getByRole('heading', { name: 'My groups' })).toBeVisible();
  }

  async checkHeaderSubtitleIsVisible(): Promise<void> {
    await expect.soft(
      this.page.getByText('Join new groups')
    ).toBeVisible();
  }

  async checkJoinedGroupsSectionIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('The groups you joined')).toBeVisible();
  }

  async checkJoinedGroupIsVisible(groupName: string): Promise<void> {
    await expect.soft(
      this.page
        .locator('alg-joined-group-list', { hasText: groupName })
        .getByRole('row', { name: groupName })
    ).toBeVisible();
  }

  async waitGroupMembershipsResponse(): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/current-user/group-memberships`);
  }

  async checkJoinByCodeIsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Join a group by code')).toBeVisible();
  }

  async joinByCode(code: string): Promise<void> {
    const inputLocator = this.page.getByPlaceholder('Group code');
    await expect.soft(inputLocator).toBeVisible();
    await inputLocator.fill(code);
    const joinBtnLocator = this.page.getByText(/^Join$/);
    await expect.soft(joinBtnLocator).toBeVisible();
    await joinBtnLocator.click();
    await this.page.waitForResponse(`${apiUrl}/groups/is-code-valid?code=${code}`);
  }

  async leaveGroup(groupName: string): Promise<void> {
    const joinedGroupListLocator = this.page
      .locator('alg-joined-group-list', { hasText: groupName })
      .getByRole('row', { name: groupName })
      .getByRole('button');
    await expect.soft(joinedGroupListLocator).toBeVisible();
    await joinedGroupListLocator.hover();
    await joinedGroupListLocator.click();
    const leaveGroupButtonLocator = this.page.getByRole('button', { name: 'Yes, leave group' });
    await expect.soft(leaveGroupButtonLocator).toBeVisible();
    await leaveGroupButtonLocator.click();
    await expect.soft(this.page.locator('p-toastitem', { hasText: `You have left "${ groupName }"` })).toBeVisible();
  }

  async checkGroupIsLockToLeave(groupName: string): Promise<void> {
    const joinedGroupListLocator = this.page.locator('alg-joined-group-list', { hasText: groupName });
    await expect.soft(joinedGroupListLocator).toBeVisible();
    await expect.soft(joinedGroupListLocator.getByRole('row', { name: groupName }).getByRole('button')).not.toBeVisible();
  }

  async isGroupLockToLeave(groupName: string): Promise<boolean> {
    const joinedGroupListLocator = this.page.locator('alg-joined-group-list', { hasText: groupName });
    await expect.soft(joinedGroupListLocator).toBeVisible();
    return joinedGroupListLocator.getByRole('row', { name: groupName }).getByRole('button').isVisible();
  }

  async isUserJoinedToGroup(groupName: string): Promise<boolean> {
    return this.page.locator('alg-joined-group-list', { hasText: groupName })
      .getByRole('row', { name: groupName })
      .getByRole('button')
      .isVisible();
  }

  async checkIsPendingInvitationsVisible(): Promise<void> {
    await expect.soft(this.page.getByText('Pending invitations')).toBeVisible();
  }

  async waitGroupInvitationsResponse(): Promise<void> {
    await this.page.waitForResponse(`${apiUrl}/current-user/group-invitations`);
  }

  async checkIsUserInvitedToGroupVisible(groupName: string): Promise<void> {
    await expect.soft(this.userGroupInvitationsLocator.filter({ has: this.page.locator('table') })).toBeVisible();
    await expect.soft(this.userGroupInvitationsLocator.getByRole('cell', { name: groupName })).toBeVisible();
  }

  async isUserInvitedToGroup(groupName: string): Promise<boolean> {
    await expect.soft(this.userGroupInvitationsLocator.filter({ has: this.page.locator('table') })).toBeVisible();
    return this.userGroupInvitationsLocator.getByRole('cell', { name: groupName }).isVisible();
  }

  async acceptGroupInvitation(groupName: string): Promise<void> {
    const acceptBtnLocator = this.page.getByRole('row', { name: groupName }).getByTestId('accept-group');
    await expect.soft(acceptBtnLocator).toBeVisible();
    await acceptBtnLocator.click();
  }

  async checksNonAuthMessageIsVisible(): Promise<void> {
    await expect.soft(
      this.page.getByText('To join a group, you first have to log in or sign in using the top right button.')
    ).toBeVisible();
  }
}
