import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GetItemByIdService } from '../../data-access/get-item-by-id.service';
import { createResolutionCache } from '../../utils/resolution-cache';

/**
 * Page-scoped cache for item titles.
 * Each ID is resolved at most once: concurrent or subsequent requests for the same ID
 * reuse a single in-flight/completed observable via `shareReplay(1)`.
 * Failed lookups (403/404) are cached as `null` to avoid retrying invisible items.
 * Not provided in root: scope to the community page so the cache is released on teardown.
 */
@Injectable()
export class EntityResolutionCacheService {
  private getItemByIdService = inject(GetItemByIdService);

  private itemCache = createResolutionCache<string | null>(id =>
    this.getItemByIdService.get(id).pipe(map(item => item.string.title)),
  );

  /** Returns the item title, or `null` if the item is invisible. */
  resolveItem(itemId: string): Observable<string | null> {
    return this.itemCache.get(itemId);
  }

  /** Eagerly triggers item-title resolution for a batch of IDs. Already-cached IDs are skipped. */
  prefetchItems(itemIds: string[]): void {
    this.itemCache.prefetch(itemIds);
  }
}
