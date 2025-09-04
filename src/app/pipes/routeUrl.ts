import { inject, Pipe, PipeTransform } from '@angular/core';
import { isRawGroupRoute, RawGroupRoute } from '../models/routing/group-route';
import { RawItemRoute } from '../models/routing/item-route';
import { ItemRouter } from '../models/routing/item-router';
import { GroupRouter } from '../models/routing/group-router';
import { UrlTree } from '@angular/router';

@Pipe({
  name: 'url', pure: true,
  standalone: true
})
export class RouteUrlPipe implements PipeTransform {
  private itemRouter = inject(ItemRouter);
  private groupRouter = inject(GroupRouter);

  transform(route: RawItemRoute|RawGroupRoute, page?: string[]): UrlTree {
    return isRawGroupRoute(route) ? this.groupRouter.url(route, page) : this.itemRouter.url(route, page);
  }
}
