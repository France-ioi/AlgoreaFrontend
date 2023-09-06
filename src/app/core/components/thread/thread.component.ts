import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ThreadService } from '../../../modules/item/services/threads.service';
import { FormBuilder } from '@angular/forms';
import { readyData } from '../../../shared/operators/state';
import { Subscription, filter, delay, combineLatest, of } from 'rxjs';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { catchError, distinctUntilChanged, map, mergeScan, scan, startWith, withLatestFrom } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetUserService } from 'src/app/modules/group/http-services/get-user.service';
import { UserInfo } from '../thread-message/thread-user-info';
import { rawItemRoute } from 'src/app/shared/routing/item-route';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  readonly state$ = this.threadService.eventsState$;

  private distinctUsersInThread = this.state$.pipe(
    map(state => state.data ?? []), // if there is no data, consider there is no events
    map(events => events.map(e => e.createdBy)),
    scan((acc: string[], val) => [ ...new Set([ ...acc, ...val ]) ].sort() , []),
    startWith([]),
    distinctUntilChanged((prev, cur) => JSON.stringify(prev) === JSON.stringify(cur))
  );
  readonly userCache$ = combineLatest([
    this.distinctUsersInThread,
    this.userSessionService.userProfile$,
    this.groupWatchingService.watchedGroup$
  ]).pipe(
    map(([ users, currentUser, watchedGroup ]) => users.map(id => ({
      id,
      isCurrentUser: id === currentUser.groupId,
      isThreadParticipant: id === watchedGroup?.route.id || (!watchedGroup && id === currentUser.groupId),
      name: id === currentUser.groupId ? formatUser(currentUser) : id === watchedGroup?.route.id ? watchedGroup.name : undefined,
    }))),
    mergeScan((acc: UserInfo[], users) => combineLatest(users.map(u => {
      if (u.name !== undefined) return of({ ...u, notVisibleUser: false });
      const lookup = acc.find(user => user.id === u.id);
      if (lookup?.name !== undefined || lookup?.notVisibleUser) return of(lookup);
      return this.userService.getForId(u.id).pipe(
        map(user => ({ ...u, notVisibleUser: false, name: formatUser(user) })),
        startWith({ ...u, notVisibleUser: false }),
        catchError(() => of({ ...u, notVisibleUser: true })),
      );
    })), [] /* scan seed */, 1 /* no concurrency */),
  );
  readonly canCurrentUserLoadAnswers$ = this.threadService.threadInfo$.pipe(
    map(t => t?.isMine || t?.canWatch), // for future: others should be able to load as well using the answer stored in msg data
  );
  readonly itemRoute$ = this.threadService.threadInfo$.pipe(
    map(t => (t ? rawItemRoute('activity', t.itemId) : undefined)),
  );

  private subscription?: Subscription;

  constructor(
    private threadService: ThreadService,
    private discussionService: DiscussionService,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private userService: GetUserService,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.subscription = this.state$.pipe(
      readyData(),
      withLatestFrom(this.discussionService.visible$),
      filter(([ events, visible ]) => visible && events.length > 0),
      delay(0),
    ).subscribe(() => this.scrollDown());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  sendMessage(): void {
    const messageToSend = this.form.value.messageToSend?.trim();
    if (!messageToSend) return;
    this.threadService.sendMessage(messageToSend);
    this.form.reset({
      messageToSend: '',
    });
  }

  scrollDown(): void {
    if (!this.messagesScroll) return;

    this.messagesScroll.nativeElement.scrollTo(
      0,
      this.messagesScroll.nativeElement.scrollHeight - this.messagesScroll.nativeElement.offsetHeight
    );
  }
}
