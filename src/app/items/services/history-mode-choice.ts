import { Injectable } from '@angular/core';
import { HistoryViewMode } from '../containers/item-log-view/history-view-mode';

/**
 * The History mode the user last picked explicitly, kept at item-page level so it survives the History
 * route being destroyed on tab switches. Valid only for the navigation key (item, attempt, observation)
 * it was taken under; dropped with the item page, so a reload forgets it.
 */
@Injectable()
export class HistoryModeChoice {
  private choice: { navigationKey: string, mode: HistoryViewMode } | null = null;

  /** The choice taken under `navigationKey`, if any. A choice taken under another key is forgotten. */
  recall(navigationKey: string): HistoryViewMode | null {
    if (this.choice?.navigationKey !== navigationKey) this.choice = null;
    return this.choice?.mode ?? null;
  }

  remember(navigationKey: string, mode: HistoryViewMode): void {
    this.choice = { navigationKey, mode };
  }
}
