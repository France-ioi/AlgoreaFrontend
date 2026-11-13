import { Observable, of, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { Task } from 'src/app/items/api/task-proxy';
import { errorState, FetchState, fetchingState, readyState } from 'src/app/utils/state';
import { loadEditsFirstPage, loadEditsNextPage } from './history-edits-load';
import { HistoryEditsPager } from './history-edits-pager';
import { HistoryListRow } from './history-list-merge';

/** Owns dual-stream buffers and maps load results into list FetchState for the History page. */
export class HistoryEditsFacade {
  private readonly pager = new HistoryEditsPager();
  /** Bumped on reload/destroy so in-flight loadMore results are ignored. */
  private generation = 0;
  private loadMoreSub: Subscription | undefined;

  constructor(
    private readonly setState: (state: FetchState<HistoryListRow[]>) => void,
    private readonly setCanLoadMore: (canLoadMore: boolean) => void,
    private readonly onLoadMoreError: () => void,
    private readonly profileId$: Observable<string>,
    private readonly fetchEvents: (attemptId: string, latest?: ActivityLogs[number]) => Observable<ActivityLogs>,
  ) {}

  /** Cancel in-flight loadMore and invalidate its generation (Refresh, mode change, destroy). */
  invalidate(): void {
    this.generation += 1;
    this.loadMoreSub?.unsubscribe();
    this.loadMoreSub = undefined;
  }

  destroy(): void {
    this.invalidate();
  }

  reload(
    task: Task | undefined,
    attemptId: string | undefined,
    savesEditorHistory: boolean | undefined,
    taskAttemptId: string | undefined,
  ): Observable<FetchState<HistoryListRow[]>> {
    this.invalidate();
    this.setCanLoadMore(false);
    if (!task || savesEditorHistory !== true || taskAttemptId !== attemptId || attemptId === undefined) {
      this.pager.reset();
      return of(readyState([]));
    }

    const generation = this.generation;
    return loadEditsFirstPage({
      pager: this.pager,
      task,
      fetchEvents: () => this.fetchEvents(attemptId),
      profileId$: this.profileId$,
    }).pipe(
      map(state => {
        if (generation !== this.generation) return fetchingState<HistoryListRow[]>();
        if (state.isReady) {
          this.setCanLoadMore(state.data.canLoadMore);
          return readyState(state.data.rows);
        }
        if (state.isError) return errorState(state.error);
        return fetchingState<HistoryListRow[]>();
      }),
    );
  }

  loadMore(
    isFetching: boolean,
    previous: HistoryListRow[] | undefined,
    task: Task | undefined,
    attemptId: string | undefined,
  ): void {
    if (isFetching || !task || attemptId === undefined) return;
    this.setState(fetchingState(previous));

    const generation = this.generation;
    this.loadMoreSub?.unsubscribe();
    this.loadMoreSub = loadEditsNextPage({
      pager: this.pager,
      task,
      fetchEvents: latest => this.fetchEvents(attemptId, latest),
      profileId$: this.profileId$,
    }).pipe(take(1)).subscribe(result => {
      if (generation !== this.generation) return;
      if (result === null || result.isError) {
        if (result?.isError) this.onLoadMoreError();
        this.setState(readyState(previous ?? []));
        return;
      }
      if (result.isReady) {
        this.setCanLoadMore(result.data.canLoadMore);
        this.setState(readyState(result.data.rows));
      }
    });
  }
}
