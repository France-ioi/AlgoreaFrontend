import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../utils/url';
import { GroupLike, isRawGroupRoute, RawGroupRoute, rawGroupRoute } from '../models/routing/group-route';
import { GroupRouter } from '../models/routing/group-router';

/**
 * Pipe to format group links from a group object, a user/profile object or a group route object.
 */
@Pipe({
  name: 'groupLink', pure: true,
  standalone: true
})
export class GroupLinkPipe implements PipeTransform {
  constructor(private groupRouter: GroupRouter) {}

  transform(groupOrRoute: GroupLike | RawGroupRoute, page?: string[]): UrlCommand {
    const route = isRawGroupRoute(groupOrRoute) ? groupOrRoute : rawGroupRoute(groupOrRoute);
    return this.groupRouter.urlArray(route, page);
  }
}
