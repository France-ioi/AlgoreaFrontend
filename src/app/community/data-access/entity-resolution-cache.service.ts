import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { GetUserService } from '../../groups/data-access/get-user.service';
import { GetItemByIdService } from '../../data-access/get-item-by-id.service';
import { UserSessionService } from '../../services/user-session.service';
import { formatUser } from '../../groups/models/user';

/**
 * Session-scoped cache for user display names and item titles.
 * Each ID is resolved at most once: concurrent or subsequent requests for the same ID
 * reuse a single in-flight/completed observable via `shareReplay(1)`.
 * Failed lookups (403/404) are cached as `null` to avoid retrying invisible entities.
 */
@Injectable({ providedIn: 'root' })
export class EntityResolutionCacheService {
  private getUserService = inject(GetUserService);
  private getItemByIdService = inject(GetItemByIdService);
  private userSessionService = inject(UserSessionService);

  private userCache = new Map<string, Observable<string | null>>();
  private itemCache = new Map<string, Observable<string | null>>();

  /** Returns the formatted display name, or `null` if the user is invisible. Skips HTTP for the current user. */
  resolveUser(participantId: string): Observable<string | null> {
    const cached = this.userCache.get(participantId);
    if (cached) return cached;

    const resolution$ = this.userSessionService.userProfile$.pipe(
      take(1),
      switchMap(currentUser => {
        if (participantId === currentUser.groupId) {
          return of(formatUser({
            login: currentUser.login,
            firstName: currentUser.profile?.firstName,
            lastName: currentUser.profile?.lastName,
          }));
        }
        return this.getUserService.getForId(participantId).pipe(
          map(user => formatUser(user)),
          catchError(() => of(null as string | null)),
        );
      }),
      shareReplay(1),
    );
    this.userCache.set(participantId, resolution$);
    return resolution$;
  }

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

  /** Eagerly triggers resolution for a batch of IDs. Duplicates are safe — already-cached IDs are skipped. */
  prefetch(participantIds: string[], itemIds: string[]): void {
    for (const pid of participantIds) {
      this.resolveUser(pid).subscribe();
    }
    for (const iid of itemIds) {
      this.resolveItem(iid).subscribe();
    }
  }
}
