import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import { AttemptId, ItemRoute, RawItemRoute, rawItemRoute } from '../routing/item-route';

/**
 * Functions using full item route should always be preferred to raw item route!
 * (requests will be required to fetch path and attempt information)
 */
@Pipe({ name: 'rawItemRoute', pure: true })
export class RawItemRoutePipe implements PipeTransform {
  transform({ id, type }: { id: string, type: ItemType }): RawItemRoute {
    return rawItemRoute(typeCategoryOfItem({ type }), id);
  }
}

/**
 * Functions using full item route should always be preferred to raw item route!
 * (requests will be required to fetch path and attempt information)
 */
@Pipe({ name: 'withAnswer', pure: true })
export class ItemRouteWithAnswerPipe implements PipeTransform {
  transform<T extends RawItemRoute>(route: T, answer: ItemRoute['answer']): T {
    return { ...route, answer };
  }
}

@Pipe({ name: 'withParentAttempt', pure: true })
export class ItemRouteWithParentAttemptPipe implements PipeTransform {
  transform<T extends RawItemRoute>(route: T, parentAttemptId: AttemptId): T {
    return { ...route, parentAttemptId };
  }
}

@Pipe({ name: 'withPath', pure: true })
export class ItemRouteWithPathPipe implements PipeTransform {
  transform<T extends RawItemRoute>(route: T, path: string[], root?: string): ItemRoute {
    return { ...route, path: [ ...path, ...(root ? [ root ] : []) ] };
  }
}
