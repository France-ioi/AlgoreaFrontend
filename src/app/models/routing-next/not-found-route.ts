import { ContentRoute } from './content-route';
import { UrlSegment } from '@angular/router';

export class NotFoundRoute extends ContentRoute {

  constructor(public segments: UrlSegment[]) {
    super();
  }

  override urlSegments(): UrlSegment[] {
    return this.segments;
  }
}
