import { Pipe, PipeTransform } from '@angular/core';
import { isString } from '../helpers/type-checkers';
import { UrlCommand } from '../helpers/url';
import { isRawGroupRoute, RawGroupRoute, urlArrayForGroupRoute } from '../routing/group-route';
import { RawItemRoute, urlArrayForItemRoute } from '../routing/item-route';

@Pipe({ name: 'url', pure: true })
export class RouteUrlPipe implements PipeTransform {
  transform(route: RawItemRoute|RawGroupRoute, page?: string|string[]): UrlCommand {
    return isRawGroupRoute(route) ? urlArrayForGroupRoute(route, isString(page) ? [ page ] : page) : urlArrayForItemRoute(route, page);
  }
}
