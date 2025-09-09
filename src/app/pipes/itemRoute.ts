import { inject, Pipe, PipeTransform } from '@angular/core';
import { ItemType, ItemTypeCategory, typeCategoryOfItem } from '../items/models/item-type';
import {
  ItemRoute,
  RawItemRoute,
  itemRoute,
  itemRouteWith,
  selectObservedGroupRouteAsItemRouteParameter
} from '../models/routing/item-route';
import { Store } from '@ngrx/store';

/**
 * Pipe for building a item route from an object
 */
@Pipe({
  name: 'itemRoute',
  pure: true,
  standalone: true
})
export class ItemRoutePipe implements PipeTransform {

  private store = inject(Store);
  private observedGroupRouteAsItemRouteParameterSignal = this.store.selectSignal(selectObservedGroupRouteAsItemRouteParameter);

  transform(item: { id: string } & ({ type: ItemType }|{ contentType: ItemTypeCategory }), extraAttrs?: Partial<ItemRoute>): RawItemRoute {
    const attrs = { ...this.observedGroupRouteAsItemRouteParameterSignal(), ...extraAttrs };
    return itemRoute('type' in item ? typeCategoryOfItem(item): item.contentType, item.id, attrs);
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
    return itemRouteWith(route, attrs);
  }
}
