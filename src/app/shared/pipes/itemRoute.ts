import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, typeCategoryOfItem } from '../helpers/item-type';
import {
  AttemptId,
  fullItemRoute,
  FullItemRoute,
  isFullItemRoute,
  isRawRouteItemRoute,
  isRouteWithSelfAttempt,
  itemRoute,
  ItemRoute,
  RawItemRoute,
  rawItemRoute
} from '../routing/item-route';

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

@Pipe({ name: 'itemRoute', pure: true })
export class ItemRoutePipe implements PipeTransform {
  transform<T extends RawItemRoute>(
    route: T,
    params: {
      answer?: ItemRoute['answer'],
      attemptId?: AttemptId,
      parentAttemptId?: AttemptId,
      path?: string[],
    }
  ): ItemRoute | FullItemRoute {
    const rawRouteWithParams = { ...route, ...params };
    if (!isRawRouteItemRoute(rawRouteWithParams)) {
      throw new Error('Unexpected: Must be ItemRoute or FullItemRoute');
    }
    return {
      ...isFullItemRoute(rawRouteWithParams) ? fullItemRoute(
        rawRouteWithParams.contentType,
        rawRouteWithParams.id,
        rawRouteWithParams.path,
        isRouteWithSelfAttempt(rawRouteWithParams)
          ? { attemptId: rawRouteWithParams.attemptId } : { parentAttemptId: rawRouteWithParams.parentAttemptId },
      ) : itemRoute(rawRouteWithParams.contentType, rawRouteWithParams.id, rawRouteWithParams.path),
      ...(params.answer ? { answer: params.answer } : {}),
    };
  }
}
