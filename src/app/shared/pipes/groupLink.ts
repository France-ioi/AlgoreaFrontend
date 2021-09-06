import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { GroupLike, isRawGroupRoute, RawGroupRoute, rawGroupRoute } from '../routing/group-route';
import { urlArrayForGroupRoute } from '../routing/group-route';

/**
 * Pipe to format group links, with or without the path
 * Since a user is considered as a group of one person, user routes are formatted using this pipe too.
 */
@Pipe({ name: 'groupLink', pure: true })
export class GroupLinkPipe implements PipeTransform {
  transform(groupOrRoute: GroupLike | RawGroupRoute, page?: string): UrlCommand {
    const route = isRawGroupRoute(groupOrRoute) ? groupOrRoute : rawGroupRoute(groupOrRoute);
    return urlArrayForGroupRoute(route, page);
  }
}
