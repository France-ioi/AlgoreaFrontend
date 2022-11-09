import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  combineLatestWith,
  EMPTY,
  filter,
  fromEvent,
  map,
  ReplaySubject,
  SubscriptionLike,
  switchMap,
  take
} from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { readyData } from 'src/app/shared/operators/state';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ThreadService } from '../../services/threads.service';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements OnInit, OnChanges, OnDestroy {
  @Input() itemId?: string;

  messageToSend = '';
  widgetOpened$ = new BehaviorSubject<boolean>(false);

  state$ = this.threadService.state$;

  private itemId$ = new ReplaySubject<string>(1);

  private subscriptions = [
    combineLatest([ this.itemId$, this.userSession.userProfile$, this.groupWatchingService.watchedGroup$ ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere
      .subscribe(([ itemId, profile, watchedGroup ]) => {
        this.threadService.leaveThread();
        this.widgetOpened$.next(false);
        this.threadService.setThread({
          participantId: watchedGroup?.route.id || profile.groupId,
          itemId,
          userId: profile.groupId,
          isMine: !watchedGroup,
          canWatchParticipant: !!watchedGroup,
        });
        // this.latestRead = new Date();
      }),

    fromEvent(window, 'beforeunload').subscribe(() => this.threadService.leaveThread()),
  ];

  unreadCount$ = this.widgetOpened$.pipe(
    map(open => (open ? Number.MAX_SAFE_INTEGER : Date.now())),
    combineLatestWith(this.state$),
    map(([ lastOpen, state ]) => {
      if (lastOpen === Number.MAX_SAFE_INTEGER || !state.isReady) return 0;
      return state.data.filter(e => e.time.valueOf() > lastOpen).length;
    })
  );

  private syncSub?: SubscriptionLike;

  constructor(
    private threadService: ThreadService,
    private userSession: UserSessionService,
    private groupWatchingService: GroupWatchingService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.itemId && changes.itemId) {
      const previousItemId = changes.itemId?.previousValue as string | undefined;
      if (this.itemId !== previousItemId) this.itemId$.next(this.itemId);
    }
  }

  ngOnInit(): void {
    this.toggleWidget(true);
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.threadService.leaveThread();
  }

  toggleWidget(opened: boolean): void {
    this.widgetOpened$.next(opened);
    // when opening widget, if the event list is empty, send the event log from the backend
    if (opened) {
      this.syncSub = this.state$.pipe(
        readyData(),
        take(1),
        filter(events => events.length === 0),
        switchMap(() => this.threadService.syncEvents()),
      ).subscribe({
        error: err => {
          if (!(err instanceof HttpErrorResponse)) throw err;
        }
      });
    }
  }

  sendMessage(): void {
    const messageToSend = this.messageToSend.trim();
    if (!messageToSend) return;
    this.threadService.sendMessage(messageToSend);
    this.messageToSend = '';
  }

  newActivityOnTask(): void {
    this.syncSub = this.threadService.syncEvents().subscribe({
      error: err => {
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

}
