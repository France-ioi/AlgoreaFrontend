import { Pipe, PipeTransform } from '@angular/core';
import { UrlCommand } from '../helpers/url';
import { RawItemRoute, urlArrayForItemRoute } from '../routing/item-route';

@Pipe({ name: 'itemRouteLink', pure: true })
export class ItemRouteLinkPipe implements PipeTransform {
  transform(route: RawItemRoute, page?: string|string[], answerId?: string): UrlCommand {
    return urlArrayForItemRoute({ ...route, answerId }, page);
  }
}
