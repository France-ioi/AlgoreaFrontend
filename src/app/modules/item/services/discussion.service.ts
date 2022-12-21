import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { combineLatestWith, EMPTY, filter, map, merge, Observable, of, shareReplay, Subject, Subscription, switchMap, take } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { readyData } from 'src/app/shared/operators/state';
import { ThreadService } from './threads.service';

/**
 * DiscussionService is a proxy to the "thread" service so that it can be loaded only if enabled and so that the UI can use it more easily.
 */
@Injectable({
  providedIn: 'root',
})
export class DiscussionService implements OnDestroy {

  private readonly enabled = !!appConfig.forumServerUrl;

  private manualVisibilityToggle = new Subject<boolean>();

  private readonly threadService?: ThreadService; // only injected if forum is enabled

  /**
    * Whether a thread is currently available (i.e., enabled at app level + allowed for the current page) and
    * visible (i.e., currently shown) for this page.
    * Emit `undefined` if not available, `{ visible: boolean }` otherwise.
    */
  state$: Observable<{ visible: boolean }|undefined>; // set in constructor when the threadService has been injected

  /**
   * When a thread is available but currently not visible, the number of events that arrive since the thread was last opened in this session
   */
  unreadCount$: Observable<number>; // set in constructor when the threadService has been injected

  private subscriptions = new Subscription();

  constructor(
    private injector : Injector,
  ) {
    if (!this.enabled) {
      this.state$ = of(undefined);
      this.unreadCount$ = EMPTY;
      return;
    }

    this.threadService = this.injector.get<ThreadService>(ThreadService);

    this.state$ = merge(
      this.manualVisibilityToggle.pipe(map(visible => ({ visible }))),
      this.threadService.threadInfo$.pipe(map(info => (info ? { visible: false } : undefined)))
    ).pipe(shareReplay(1)); // keep the last value for latecomers
    this.unreadCount$ = this.state$.pipe(
      // when hidden (manually or because thread changes), store the current time as the last read time
      map(state => (state && !state.visible ? Date.now() : Number.MAX_SAFE_INTEGER)),
      combineLatestWith(this.threadService.eventsState$ ?? EMPTY),
      map(([ lastOpen, state ]) => {
        if (lastOpen === Number.MAX_SAFE_INTEGER || !state.isReady) return 0;
        return state.data.filter(e => e.time.valueOf() > lastOpen).length;
      })
    );
    this.subscriptions.add(
      this.state$.pipe(
        filter(state => !!state && state.visible), // each time a discussion becomes visible
        switchMap(() => this.threadService?.eventsState$.pipe(readyData(), take(1)) ?? EMPTY), // take the next ready data
        filter(events => events.length === 0), // if there were no event in the list
        switchMap(() => this.threadService?.syncEvents() ?? EMPTY), // resync the event log with the server
      ).subscribe({
        error: err => {
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.manualVisibilityToggle.complete();
  }

  toggleVisibility(visible: boolean): void {
    this.manualVisibilityToggle.next(visible);
  }

  resyncEventLog(): void {
    if (!this.threadService) return;
    this.subscriptions.add(
      this.threadService.syncEvents().subscribe({
        error: err => {
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      })
    );
  }

}
