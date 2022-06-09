import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { catchError, combineLatest, EMPTY, map, ReplaySubject } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
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

  messages$ = this.threadService.messages$;
  threadClosed$ = this.messages$.pipe(map(messages => messages.some(message => message.eventType === 'thread_closed')));

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
  ];

  constructor(
    private threadService: ThreadService,
    private userSession: UserSessionService,
    private groupWatchingService: GroupWatchingService,
  ) {}

  ngOnChanges(): void {
    if (!this.itemData) return;
    this.itemData$.next(this.itemData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  openThread(): void {
    this.threadService.send('open-thread');
  }

  closeThread(): void {
    this.threadService.send('close-thread');
  }

}
