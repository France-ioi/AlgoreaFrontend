import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { createResolutionCache } from '../../utils/resolution-cache';
import { User } from '../models/user';
import { GetUserService } from './get-user.service';

/**
 * Session-scoped cache for user lookups.
 * Each ID is resolved at most once: concurrent or subsequent requests for the same ID
 * reuse a single in-flight/completed observable via `shareReplay(1)`.
 * Failed lookups are cached as `null` to avoid retrying.
 *
 * Warning: this service is `providedIn: 'root'`, so its cache grows for every distinct user id
 * seen during the app session and is never evicted. Consider adding explicit
 * cleanup (LRU cap, reset when context changes, `OnDestroy`, etc.) if usage spreads beyond
 * short-lived views.
 */
@Injectable({ providedIn: 'root' })
export class UserResolutionCacheService {
  private getUserService = inject(GetUserService);

  private userCache = createResolutionCache<User>(id => this.getUserService.getForId(id));

  resolveUser(id: string): Observable<User | null> {
    return this.userCache.get(id);
  }

  prefetchUsers(ids: string[]): void {
    this.userCache.prefetch(ids);
  }
}
