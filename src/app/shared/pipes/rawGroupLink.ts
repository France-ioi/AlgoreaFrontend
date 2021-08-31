import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { RawGroupRoute } from '../routing/group-route';
import { urlArrayForGroupRoute } from '../routing/group-route';

/**
 * Functions using item route should always be preferred to raw item.
 * Using raw item means further requests will be required to fetch path and attempt information.
 */
@Pipe({ name: 'rawGroupLink', pure: true })
export class RawGroupLinkPipe implements PipeTransform {
  transform(route: RawGroupRoute, isUser?: boolean): UrlCommand {
    return urlArrayForGroupRoute(route, 'details', isUser);
  }
}
