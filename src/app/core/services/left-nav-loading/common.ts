import { ContentInfo } from 'src/app/shared/services/current-content.service';

export type LeftNavTab = 'activities'|'skills'|'groups';

export interface LeftNavLoader {

  /**
   * Load root elements
   */
  initializeRoot(): void;

  /**
   * Load the given content in this tab
   */
  showContent(content: ContentInfo): void;

  /**
   * If there is a selected element, unselect this selection.
   */
  removeSelection(): void;

}
