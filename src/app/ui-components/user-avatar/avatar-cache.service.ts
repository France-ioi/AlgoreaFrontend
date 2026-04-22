import { Injectable, OnDestroy } from '@angular/core';
import { Avatar } from './avatar';

// Cap kept small on purpose: avatars are cheap to recompute and the cache only exists to dedupe the
// few dozen seeds visible on a single page. A larger cap would defeat the goal of bounding memory
// for long-lived sessions.
const MAX_CACHE_ENTRIES = 30;

/**
 * Bounded LRU cache for `Avatar` values keyed by seed.
 *
 * Pure storage: callers (e.g. `UserAvatarComponent`) decide how to produce an avatar on a miss
 * and feed it back via `set`. Not provided in root: scope to the feature that displays many
 * avatars (e.g. the community page) so the cache is released on teardown. Angular calls
 * `ngOnDestroy` on the component-scoped instance when its host component is destroyed.
 */
@Injectable()
export class AvatarCacheService implements OnDestroy {
  // Map iteration order is insertion order; we re-insert on access to maintain LRU ordering.
  private readonly cache = new Map<string, Avatar>();

  get(seed: string): Avatar | undefined {
    const cached = this.cache.get(seed);
    if (!cached) return undefined;
    this.cache.delete(seed);
    this.cache.set(seed, cached);
    return cached;
  }

  set(seed: string, avatar: Avatar): void {
    this.cache.set(seed, avatar);
    if (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
  }

  ngOnDestroy(): void {
    this.cache.clear();
  }
}
