import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { GetItemByIdService } from '../../data-access/get-item-by-id.service';

/**
 * Session-scoped cache for item titles.
 * Each ID is resolved at most once: concurrent or subsequent requests for the same ID
 * reuse a single in-flight/completed observable via `shareReplay(1)`.
 * Failed lookups (403/404) are cached as `null` to avoid retrying invisible items.
 */
@Injectable({ providedIn: 'root' })
export class EntityResolutionCacheService {
  private getItemByIdService = inject(GetItemByIdService);

  private itemCache = new Map<string, Observable<string | null>>();

  /** Returns the item title, or `null` if the item is invisible. */
  resolveItem(itemId: string): Observable<string | null> {
    const cached = this.itemCache.get(itemId);
    if (cached) return cached;

    const resolution$ = this.getItemByIdService.get(itemId).pipe(
      map(item => item.string.title),
      catchError(() => of(null as string | null)),
      shareReplay(1),
    );
    this.itemCache.set(itemId, resolution$);
    return resolution$;
  }

  /** Eagerly triggers item-title resolution for a batch of IDs. Already-cached IDs are skipped. */
  prefetchItems(itemIds: string[]): void {
    for (const iid of itemIds) {
      this.resolveItem(iid).subscribe();
    }
  }
}
