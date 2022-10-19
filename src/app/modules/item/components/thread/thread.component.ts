import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { catchError, combineLatest, EMPTY, fromEvent, map, ReplaySubject, skip, switchMap, take } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ThreadService, ThreadState } from '../../services/threads.service';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements OnChanges, OnDestroy {
  @Input() itemId?: string;

  messageToSend = '';
  openingThread = false;
  widgetOpened = false;

  events$ = this.threadService.events$;
  threadState$ = this.threadService.state$;
  canOpenThread$ = combineLatest([ this.groupWatchingService.isWatching$, this.threadState$ ]).pipe(
    map(([ isWatching, status ]) => !isWatching && status === ThreadState.ThreadClosed),
  );
  canCloseThread$ = combineLatest([ this.groupWatchingService.isWatching$, this.threadState$ ]).pipe(
    map(([ isWatching, status ]) => !isWatching && status === ThreadState.ThreadOpened),
  );

  private itemId$ = new ReplaySubject<string>(1);

  private subscriptions = [
    combineLatest([ this.itemId$, this.userSession.userProfile$, this.groupWatchingService.watchedGroup$ ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere
      .subscribe(([ itemId, profile, watchedGroup ]) => {
        this.threadService.setThread({
          participantId: watchedGroup?.route.id || profile.groupId,
          itemId,
          userId: profile.groupId,
          isMine: !watchedGroup,
          canWatchParticipant: !!watchedGroup,
        });
      }),
    this.itemId$
      .pipe(switchMap(() => this.threadState$.pipe(take(1))))
      .subscribe(state => {
        this.widgetOpened = state === ThreadState.ThreadOpened;
      }),

    this.itemId$.pipe(skip(1)).subscribe(() => this.threadService.leaveThread()),

    fromEvent(window, 'beforeunload').subscribe(() => this.threadService.leaveThread()),
  ];

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

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.threadService.leaveThread();
  }

  openThread(): void {
    this.openingThread = true;
    this.widgetOpened = true;
    this.threadService.open(() => this.openingThread = false);
  }

  closeThread(): void {
    this.widgetOpened = false;
    this.threadService.close();
  }

  toggleWidget(opened: boolean): void {
    this.widgetOpened = opened;
  }

  sendMessage(): void {
    const messageToSend = this.messageToSend.trim();
    if (!messageToSend) return;
    this.threadService.sendMessage(messageToSend);
    this.messageToSend = '';
  }

}
