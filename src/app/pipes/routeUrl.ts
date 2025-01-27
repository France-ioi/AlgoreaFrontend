import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../utils/url';
import { isRawGroupRoute, RawGroupRoute, urlArrayForGroupRoute } from '../models/routing/group-route';
import { RawItemRoute } from '../models/routing/item-route';
import { itemRouteAsUrlCommand } from '../models/routing/item-route-serialization';

@Pipe({
  name: 'url', pure: true,
  standalone: true
})
export class RouteUrlPipe implements PipeTransform {
  transform(route: RawItemRoute|RawGroupRoute, page?: string[]): UrlCommand {
    return isRawGroupRoute(route) ? urlArrayForGroupRoute(route, page) : itemRouteAsUrlCommand(route, page);
  }
}
