import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../items/models/item-type';
import { ItemRoute, RawItemRoute, itemRoute } from '../models/routing/item-route';

/**
 * Pipe for building a item route from an object
 */
@Pipe({
  name: 'itemRoute',
  pure: true,
  standalone: true
})
export class ItemRoutePipe implements PipeTransform {
  transform(item: { id: string, type: ItemType }, extraAttrs?: Partial<ItemRoute>): RawItemRoute {
    return itemRoute(typeCategoryOfItem(item), item.id, extraAttrs);
  }
}

/**
 * Pipe for adding information to a route
 */
@Pipe({
  name: 'with',
  pure: true,
  standalone: true
})
export class ItemRouteWithExtraPipe implements PipeTransform {
  transform<T extends RawItemRoute>(route: T, attrs: Partial<ItemRoute>): T {
    return { ...route, ...attrs };
  }
}
