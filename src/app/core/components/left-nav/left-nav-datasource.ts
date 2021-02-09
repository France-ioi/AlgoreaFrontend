import { ContentInfo } from 'src/app/shared/services/current-content.service';

export abstract class LeftNavDataSource {

  /**
   * Prepare the data for display
   */
  abstract focus(): void;

  /**
   * Load the given content in this tab
   */
  abstract showContent(content: ContentInfo): void;

  /**
   * If there is a selected element, unselect this selection.
   */
  abstract removeSelection(): void;

}
