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
   * Return the url command to be given to the router
   */
  urlCommand(): UrlCommand {
    return this.urlSegments().flatMap(s => [ s.path, s.parameters ]);
  }

  abstract urlSegments(): UrlSegment[];

  /**
   * Override it to support injecting the page of another content route (typically the current one)
   */
  withPageFrom(route: ContentRoute): ContentRoute {
    return route;
  }

}
