import { by, element, ElementFinder } from 'protractor';
import { AppPage } from './app.po';

export class ItemPage extends AppPage {
  async navigateToActivity(itemId: string, path?: string[]): Promise<void> {
    const url = [
      `/activities/by-id/${itemId}`,
      path && `;path=${path.join(',')}`,
      ';parentAttempId=0/details',
    ].filter(Boolean).join('');

    await super.navigateTo(url);
  }

  getActivityTitle(): ElementFinder {
    return element(by.css('alg-item-header .task-title'));
  }
}
