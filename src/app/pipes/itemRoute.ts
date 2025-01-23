import { Pipe, PipeTransform } from '@angular/core';
import { itemType, ItemType, ItemTypeCategory, ItemTypeString, typeCategoryOfItem } from '../items/models/item-type';
import { ItemRoute, RawItemRoute, itemRoute } from '../models/routing/item-route';
import { isString } from '../utils/type-checkers';

/**
 * Pipe for building a item route from an object
 */
@Pipe({
  name: 'itemRoute',
  pure: true,
  standalone: true
})
export class ItemRoutePipe implements PipeTransform {
  transform(
    item: { id: string } & ({ type: ItemType|ItemTypeString }|{ contentType: ItemTypeCategory }),
    extraAttrs?: Partial<ItemRoute>
  ): RawItemRoute {
    let contentType: ItemTypeCategory;
    if ('type' in item) {
      const rawType = item['type'];
      const type: ItemType = isString(rawType) ? itemType(rawType) : rawType;
      contentType = typeCategoryOfItem({ type });
    } else contentType = item.contentType;
    return itemRoute(contentType, item.id, extraAttrs);
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
