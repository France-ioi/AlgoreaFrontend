import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'community_last_visited';

/**
 * Tracks the last time the user visited the Community page.
 * The timestamp is persisted in localStorage so it survives reloads.
 * Used by the community poll effect to determine whether new threads
 * have arrived since the user's last visit (notification dot logic).
 */
@Injectable({
  providedIn: 'root',
})
export class CommunityVisitService {
  lastVisited = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  markVisited(): void {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    this.lastVisited.set(now);
  }
}
