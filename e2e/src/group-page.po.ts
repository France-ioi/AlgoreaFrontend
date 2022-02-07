import { AppPage } from './app.po';

export class GroupPage extends AppPage {
  async navigateToGroup(groupId: string): Promise<void> {
    await this.navigateTo(`/groups/by-id/${groupId}/details`);
  }

  async navigateToUser(userId: string): Promise<void> {
    await this.navigateTo(`/groups/users/${userId}`);
  }
}
