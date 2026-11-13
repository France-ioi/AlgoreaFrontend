import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { TaskHistoryElement } from 'src/app/items/api/types';
import { HistoryBuffersMerge, mergeHistoryBuffers } from './history-list-merge';

export const historyEditsPageSize = 20;

/** Fetch one extra so hasMore is reliable (same pattern as DataPager). */
export const historyEditsFetchSize = historyEditsPageSize + 1;

export interface HistoryEditsBuffers {
  events: ActivityLogs,
  eventsHasMore: boolean,
  checkpoints: TaskHistoryElement[],
  checkpointsHasMore: boolean,
}

function takePage<T>(page: T[], pageSize: number): { items: T[], hasMore: boolean } {
  const hasMore = page.length > pageSize;
  return { items: hasMore ? page.slice(0, pageSize) : page, hasMore };
}

/**
 * Dual-stream buffer for Events & Edits: activity-log pages + checkpoint pages,
 * merged with a time watermark so later pages never insert above already-shown rows.
 */
export class HistoryEditsPager {
  private buffers: HistoryEditsBuffers = {
    events: [],
    eventsHasMore: false,
    checkpoints: [],
    checkpointsHasMore: false,
  };

  reset(): void {
    this.buffers = {
      events: [],
      eventsHasMore: false,
      checkpoints: [],
      checkpointsHasMore: false,
    };
  }

  /**
   * Replace buffers with the first page of each stream (each page may be fetchSize long).
   * `keepEvent` runs after page slicing so hasMore stays based on the raw API length.
   */
  setFirstPages(
    events: ActivityLogs,
    checkpoints: TaskHistoryElement[],
    keepEvent: (event: ActivityLogs[number]) => boolean = (): boolean => true,
  ): HistoryBuffersMerge {
    const eventsPage = takePage(events, historyEditsPageSize);
    const checkpointsPage = takePage(checkpoints, historyEditsPageSize);
    this.buffers = {
      events: eventsPage.items.filter(keepEvent),
      eventsHasMore: eventsPage.hasMore,
      checkpoints: checkpointsPage.items,
      checkpointsHasMore: checkpointsPage.hasMore,
    };
    return mergeHistoryBuffers(this.buffers);
  }

  /** Append next page(s); only pass streams that were fetched. */
  appendPages(
    update: {
      events?: ActivityLogs,
      checkpoints?: TaskHistoryElement[],
    },
    keepEvent: (event: ActivityLogs[number]) => boolean = (): boolean => true,
  ): HistoryBuffersMerge {
    if (update.events !== undefined) {
      const page = takePage(update.events, historyEditsPageSize);
      this.buffers = {
        ...this.buffers,
        events: [ ...this.buffers.events, ...page.items.filter(keepEvent) ],
        eventsHasMore: page.hasMore,
      };
    }
    if (update.checkpoints !== undefined) {
      const page = takePage(update.checkpoints, historyEditsPageSize);
      this.buffers = {
        ...this.buffers,
        checkpoints: [ ...this.buffers.checkpoints, ...page.items ],
        checkpointsHasMore: page.hasMore,
      };
    }
    return mergeHistoryBuffers(this.buffers);
  }

  merge(): HistoryBuffersMerge {
    return mergeHistoryBuffers(this.buffers);
  }

  /** Cursor for the next activity-log page (last buffered event). */
  latestEvent(): ActivityLogs[number] | undefined {
    const { events } = this.buffers;
    return events.length > 0 ? events[events.length - 1] : undefined;
  }

  /** Inclusive maxId for the next checkpoint page (last received id − 1). */
  nextCheckpointsMaxId(): number | undefined {
    const { checkpoints } = this.buffers;
    const oldest = checkpoints[checkpoints.length - 1];
    return oldest === undefined ? undefined : oldest.id - 1;
  }
}
