import { AppPage } from './app.po';

export class GroupsMinePage extends AppPage {
  override async navigateTo(): Promise<void> {
    await super.navigateTo('/groups/mine');
  }
}
