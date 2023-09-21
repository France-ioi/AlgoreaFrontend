import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatestWith, EMPTY, filter, map, Observable, Subscription, switchMap, take } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { readyData } from 'src/app/shared/operators/state';
import { ThreadService } from './threads.service';

type ThreadId = Parameters<ThreadService['setThread']>[0];

/**
 * DiscussionService is a proxy to the "thread" service so that it can be loaded only if enabled and so that the UI can use it more easily.
 */
@Injectable({
  providedIn: 'root',
})
export class DiscussionService implements OnDestroy {

  private readonly enabled = !!appConfig.forumServerUrl;

  private visible = new BehaviorSubject(false);
  visible$ = this.visible.asObservable();

  private readonly threadService?: ThreadService; // only injected if forum is enabled
  threadId$: Observable<ThreadId|undefined> = EMPTY;

  private canShowInCurrentPage = new BehaviorSubject(false);
  canShowInCurrentPage$ = this.canShowInCurrentPage.asObservable();

  private configuredThread: ThreadId|null = null;
  private hasForcedThread = false;

  /**
   * When a thread is available but currently not visible, the number of events that arrive since the thread was last opened in this session
   */
  unreadCount$: Observable<number>; // set in constructor when the threadService has been injected

  private subscriptions = new Subscription();

  constructor(
    private injector : Injector,
  ) {
    if (!this.enabled) {
      this.unreadCount$ = EMPTY;
      return;
    }

    this.threadService = this.injector.get<ThreadService>(ThreadService);
    this.threadId$ = this.threadService.threadId$;

    this.unreadCount$ = this.visible$.pipe(
      // when hidden (manually or because thread changes), store the current time as the last read time
      map(visible => (visible ? Number.MAX_SAFE_INTEGER : Date.now())),
      combineLatestWith(this.threadService.eventsState$ ?? EMPTY),
      map(([ lastOpen, state ]) => {
        if (lastOpen === Number.MAX_SAFE_INTEGER || !state.isReady) return 0;
        return state.data.filter(e => e.time.valueOf() > lastOpen).length;
      })
    );
    this.subscriptions.add(
      this.visible$.pipe(
        filter(visible => visible), // each time a discussion becomes visible
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
    this.visible.complete();
    this.canShowInCurrentPage.complete();
  }

  /**
   * Toggle visibily of the thread panel
   * `info` is given only if `visible` and if different from what has been configured by `configureThread`, so if we want to show a thread
   * that does not correspond to the current page.
   */
  toggleVisibility(visible: boolean, thread?: ThreadId): void {
    if (!this.threadService) return;
    this.visible.next(visible);
    this.hasForcedThread = visible && !!thread;
    this.threadService.setThread(thread ? thread : this.configuredThread);
  }

  /**
   * Configure the thread info (while the thread panel is closed)
   * `info` is null if threads are disabled on the current page
   */
  configureThread(thread: ThreadId|null): void {
    if (!this.threadService) return;
    this.canShowInCurrentPage.next(!!thread);
    this.configuredThread = thread;
    if (!this.hasForcedThread) this.threadService.setThread(thread);
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
