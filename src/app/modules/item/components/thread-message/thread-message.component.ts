import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { IncomingThreadEvent } from '../../services/threads-inbound-events';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { ReplaySubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-thread-message[event]',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
})
export class ThreadMessageComponent implements OnChanges, OnDestroy {
  @Input() event!: IncomingThreadEvent;

  event$ = new ReplaySubject<IncomingThreadEvent>(1);
  isMessageCreatedByCurrentUser$ = combineLatest([
    this.userSessionService.userProfile$,
    this.event$,
  ]).pipe(
    map(([ currentUser, event ]) => currentUser.groupId === event.createdBy),
  );

  constructor(private userSessionService: UserSessionService) {
  }

  ngOnChanges(): void {
    this.event$.next(this.event);
  }

  ngOnDestroy(): void {
    this.event$.complete();
  }
}
