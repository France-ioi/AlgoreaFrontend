import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  fromEvent,
  map,
  pairwise,
  shareReplay,
  startWith,
  Subscription,
  switchMap,
  take,
} from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { appConfig } from 'src/app/shared/helpers/config';
import { isATask } from 'src/app/shared/helpers/item-type';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { formatUser } from 'src/app/shared/helpers/user';
import { isItemInfo } from 'src/app/shared/models/content/item-info';
import { allowsWatchingResults } from 'src/app/shared/models/domain/item-watch-permission';
import { readyData } from 'src/app/shared/operators/state';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ThreadService } from './threads.service';

/**
 * DiscussionService is a proxy to the "thread" service so that it can be loaded only if enabled and so that the UI can use it more easily.
 */
@Injectable({
  providedIn: 'root',
})
export class DiscussionService implements OnDestroy {

  private readonly enabled = !!appConfig.forumServerUrl;

  private visible = new BehaviorSubject<boolean>(false);

  private readonly threadService?: ThreadService; // only injected if forum is enabled

  private threadInfo$ = combineLatest([
    this.userSessionService.userProfile$,
    this.currentContentService.content$,
    this.groupWatchingService.watchedGroup$,
    fromEvent(window, 'beforeunload').pipe(map(() => true), startWith(false)),
  ]).pipe(
    debounceTime(0), // as the source are not independant, prevent some very-transient inconsistent cases
    map(([ session, content, watching, unloading ]) => {
      // window is unloading -> no thread anymore
      if (unloading) return undefined;
      // only tasks
      if (!isItemInfo(content) || !content.details || !isATask(content.details)) return undefined;
      // only non temp users
      if (session.tempUser) return undefined;
      // if watching, only for users (not group) and for content we can watch
      if (watching && (!watching.route.isUser || !allowsWatchingResults(content.details.permissions))) return undefined;
      return {
        participant: {
          id: watching ? watching.route.id : session.groupId,
          name: watching ? watching.name : formatUser(session),
        },
        currentUserId: session.groupId,
        itemRoute: content.route,
        canWatchParticipant: !!watching,
        contentWatchPermission: content.details.permissions,
      };
    }),
    startWith(undefined),
    distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
    shareReplay(1),
  );

  /**
    * Whether a thread is currently available (i.e., enabled at app level + allowed for the current page) and
    * visible (i.e., currently shown) for this page.
    * Emit `undefined` if not available, `{ visible: boolean }` otherwise.
    */
  state$ = combineLatest([ this.visible, this.threadInfo$.pipe(map(isNotUndefined)) ]).pipe(
    map(([ visible, hasThread ]) => (this.enabled && hasThread ? { visible } : undefined)));

  /**
   * When a thread is available but currently not visible, the number of events that arrive since the thread was last opened in this session
   */
  unreadCount$ = this.visible.pipe(
    map(visible => (visible ? Number.MAX_SAFE_INTEGER : Date.now())),
    combineLatestWith(this.threadService?.state$ ?? EMPTY),
    map(([ lastOpen, state ]) => {
      if (lastOpen === Number.MAX_SAFE_INTEGER || !state.isReady) return 0;
      return state.data.filter(e => e.time.valueOf() > lastOpen).length;
    })
  );


  private subscriptions = new Subscription();

  constructor(
    private injector : Injector,
    private userSessionService: UserSessionService,
    private currentContentService: CurrentContentService,
    private groupWatchingService: GroupWatchingService,
  ) {
    if (!this.enabled) return;

    this.threadService = this.injector.get<ThreadService>(ThreadService);

    this.subscriptions.add(
      this.threadInfo$.pipe(pairwise()).subscribe(
        ([ prevTokenData, thread ]) => {
          this.toggleVisibility(false); // always hide the previous discussion on thread change
          if (prevTokenData) this.threadService?.leaveThread();
          if (thread) this.threadService?.setThread(thread);
        }
      )
    );

    this.subscriptions.add(
      this.visible.pipe(
        filter(v => v), // each time a discussion becomes visible
        switchMap(() => this.threadService?.state$.pipe(readyData(), take(1)) ?? EMPTY), // take the next ready data
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
  }

  toggleVisibility(visible?: boolean): void {
    if (visible === undefined || this.visible.value !== visible) this.visible.next(!this.visible.value);
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
