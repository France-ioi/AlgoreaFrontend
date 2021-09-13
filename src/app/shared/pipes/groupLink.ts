import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { GroupLike, isRawGroupRoute, RawGroupRoute, rawGroupRoute } from '../routing/group-route';
import { urlArrayForGroupRoute } from '../routing/group-route';

/**
 * Pipe to format group links from a group object, a user/profile object or a group route object.
 */
@Pipe({ name: 'groupLink', pure: true })
export class GroupLinkPipe implements PipeTransform {
  transform(groupOrRoute: GroupLike | RawGroupRoute, page?: string): UrlCommand {
    const route = isRawGroupRoute(groupOrRoute) ? groupOrRoute : rawGroupRoute(groupOrRoute);
    return urlArrayForGroupRoute(route, page);
  }
}
