import { Pipe, PipeTransform } from '@angular/core';
import { isString } from '../utils/type-checkers';
import { UrlCommand } from '../utils/url';
import { isRawGroupRoute, RawGroupRoute, urlArrayForGroupRoute } from '../models/routing/group-route';
import { RawItemRoute, urlArrayForItemRoute } from '../models/routing/item-route';

@Pipe({
  name: 'url', pure: true,
  standalone: true
})
export class RouteUrlPipe implements PipeTransform {
  transform(route: RawItemRoute|RawGroupRoute, page?: string|string[]): UrlCommand {
    return isRawGroupRoute(route) ? urlArrayForGroupRoute(route, isString(page) ? [ page ] : page) : urlArrayForItemRoute(route, page);
  }
}
