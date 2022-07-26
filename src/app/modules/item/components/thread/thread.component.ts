import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { catchError, combineLatest, EMPTY, filter, fromEvent, map, ReplaySubject, switchMap, take } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';
import { ThreadService } from '../../services/threads.service';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  messageToSend = '';
  openingThread = false;
  widgetOpened = false;

  events$ = this.threadService.events$;
  threadStatus$ = this.threadService.status$;
  canOpenThread$ = combineLatest([ this.groupWatchingService.isWatching$, this.threadStatus$ ]).pipe(
    map(([ isWatching, status ]) => !isWatching && status !== 'opened'),
  );
  canCloseThread$ = combineLatest([ this.groupWatchingService.isWatching$, this.threadStatus$ ]).pipe(
    map(([ isWatching, status ]) => !isWatching && status === 'opened'),
  );

  private itemData$ = new ReplaySubject<ItemData>(1);

  private subscriptions = [
    combineLatest([ this.itemData$, this.userSession.userProfile$, this.groupWatchingService.watchedGroup$ ])
      .pipe(catchError(() => EMPTY)) // error is handled elsewhere
      .subscribe(([ itemData, profile, watchedGroup ]) => {
        this.threadService.init({
          participantId: watchedGroup?.route.id || profile.groupId,
          itemId: itemData.item.id,
          userId: profile.groupId,
          isMine: !watchedGroup,
          canWatchParticipant: !!watchedGroup,
        });
      }),
    this.itemData$
      .pipe(switchMap(() => this.threadStatus$), take(1), filter(status => status !== 'none'))
      .subscribe(() => this.threadService.follow()),

    fromEvent(window, 'beforeunload').subscribe(() => this.threadService.unfollow()),
  ];

  constructor(
    private threadService: ThreadService,
    private userSession: UserSessionService,
    private groupWatchingService: GroupWatchingService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.itemData || !changes.itemData) return;
    const previousValue = changes.itemData.previousValue as ItemData | undefined;
    if (previousValue && this.itemData.route.id !== previousValue.route.id) this.threadService.unfollow();
    this.itemData$.next(this.itemData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.threadService.unfollow();
  }

  openThread(): void {
    this.openingThread = true;
    this.widgetOpened = true;
    this.threadService.open();
    this.events$
      .pipe(map(events => events.find(event => event.eventType === 'thread_opened')), filter(isNotUndefined), take(1))
      .subscribe(() => this.openingThread = false);
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
