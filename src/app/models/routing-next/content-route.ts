import { UrlCommand } from 'src/app/utils/url';
import { UrlSegment, UrlSegmentGroup, UrlTree } from '@angular/router';

export abstract class ContentRoute {

  /**
   * Serialization for storing in the state
   */
  toString(): string {
    return new UrlTree(new UrlSegmentGroup(this.urlSegments(), {})).toString();
  }

  /**
   * The url command to navigate to the content.
   * @param currentRoute if given, adapt the command to the current content
   */
  urlCommand(currentRoute?: ContentRoute): UrlCommand {
    return this.urlSegments(currentRoute).flatMap(s => [ s.path, s.parameters ]);
  }

  /**
   * Convert the route url segments
   * @param currentRoute if given, adapt the command to the current content
   */
  abstract urlSegments(currentRoute?: ContentRoute): UrlSegment[];

}
