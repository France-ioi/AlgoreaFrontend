import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { GroupRoute } from '../routing/group-route';
import { urlArrayForGroup } from '../routing/group-route';

/**
 * Functions using item route should always be preferred to raw item.
 * Using raw item means further requests will be required to fetch path and attempt information.
 */
@Pipe({ name: 'groupLink', pure: true })
export class GroupLinkPipe implements PipeTransform {
  transform(route: GroupRoute, isUser?: boolean): UrlCommand {
    return urlArrayForGroup(route, 'details', isUser);
  }
}
