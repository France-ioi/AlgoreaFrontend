import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, ItemTypeCategory, typeCategoryOfItem } from '../models/item-type';
import { AttemptId, FullItemRoute, ItemRoute, RawItemRoute, rawItemRoute } from '../models/routing/item-route';

/**
 * Functions using full item route should always be preferred to raw item route!
 * (requests will be required to fetch path and attempt information)
 */
@Pipe({
  name: 'rawItemRoute', pure: true,
  standalone: true
})
export class RawItemRoutePipe implements PipeTransform {
  transform({ id, type }: { id: string, type: ItemType }): RawItemRoute {
    return rawItemRoute(typeCategoryOfItem({ type }), id);
  }
}

/**
 * Functions using full item route should always be preferred to raw item route!
 * (requests will be required to fetch path and attempt information)
 */
@Pipe({
  name: 'withAnswer', pure: true,
  standalone: true
})
export class ItemRouteWithAnswerPipe implements PipeTransform {
  transform<T extends RawItemRoute>(route: T, answer: ItemRoute['answer']): T {
    return { ...route, answer };
  }
}

@Pipe({
  name: 'contentTypeFromItem', pure: true,
  standalone: true
})
export class ContentTypeFromItemPipe implements PipeTransform {
  transform({ type } : { type: ItemType }): ItemTypeCategory {
    return typeCategoryOfItem({ type });
  }
}

@Pipe({
  name: 'withAttempt', pure: true,
  standalone: true
})
export class ItemRouteWithAttemptPipe implements PipeTransform {
  transform<T extends ItemRoute>(route: T, attempt: { attemptId: AttemptId } | { parentAttemptId: AttemptId }): FullItemRoute {
    return { ...route, ...attempt };
  }
}
