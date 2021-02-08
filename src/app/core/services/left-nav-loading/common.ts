import { ContentInfo } from 'src/app/shared/services/current-content.service';

export type LeftNavTab = 'activities'|'skills'|'groups';

export interface LeftNavLoader {

  /**
   * Prepare the data for display
   */
  focus(): void;

  /**
   * Load the given content in this tab
   */
  showContent(content: ContentInfo): void;

  /**
   * If there is a selected element, unselect this selection.
   */
  removeSelection(): void;

}
