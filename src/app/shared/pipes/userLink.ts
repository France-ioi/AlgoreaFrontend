import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { RawGroupRoute } from '../routing/group-route';
import { urlArrayForGroupRoute } from '../routing/group-route';

/**
 * Pipe to format user routes, a user being a particular case of group.
 */
@Pipe({ name: 'userLink', pure: true })
export class UserLinkPipe implements PipeTransform {
  transform(route: RawGroupRoute): UrlCommand {
    return urlArrayForGroupRoute(route, { isUser: true });
  }
}
