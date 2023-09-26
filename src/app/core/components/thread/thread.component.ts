import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ThreadService } from '../../../modules/item/services/threads.service';
import { FormBuilder } from '@angular/forms';
import { mapStateData, mapToFetchState, readyData } from '../../../shared/operators/state';
import { filter, delay, combineLatest, of, merge, switchMap, Subject } from 'rxjs';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { catchError, distinctUntilChanged, map, mergeScan, scan, startWith, takeUntil, withLatestFrom } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetUserService } from 'src/app/modules/group/http-services/get-user.service';
import { UserInfo } from '../thread-message/thread-user-info';
import { rawItemRoute } from 'src/app/shared/routing/item-route';
import { GetItemByIdService } from '../../../modules/item/http-services/get-item-by-id.service';
import { isNotUndefined } from '../../../shared/helpers/null-undefined-predicates';
import { allowsWatchingAnswers } from '../../../shared/models/domain/item-watch-permission';
import { ActionFeedbackService } from '../../../shared/services/action-feedback.service';
import { readyState } from '../../../shared/helpers/state';

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

  readonly destroyed$ = new Subject<void>();
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
  readonly isThreadStatusOpened$ = this.threadService.threadInfo$.pipe(
    map(t => (t ? [ 'waiting_for_participant', 'waiting_for_trainer' ].includes(t.status) : false)),
  );
  readonly isCurrentUserThreadParticipant$ = this.userCache$.pipe(
    map(userCache => userCache.some(u => u.isCurrentUser && u.isThreadParticipant)),
  );
  allowToOpenThreadState$ = merge(
    of(readyState(false)),
    combineLatest([
      this.threadService.threadInfo$.pipe(
        filter(isNotUndefined),
        map(t => [ 'waiting_for_participant', 'waiting_for_trainer' ].includes(t.status)),
        filter(isThreadOpened => !isThreadOpened),
      ),
      this.discussionService.visible$.pipe(distinctUntilChanged(), filter(visible => visible)),
    ]).pipe(
      withLatestFrom(
        this.itemRoute$.pipe(filter(isNotUndefined)),
        this.isCurrentUserThreadParticipant$,
        this.groupWatchingService.watchedGroup$,
      ),
      switchMap(([ , itemRoute, isCurrentUserThreadParticipant, watchedGroup ]) =>
        this.getItemByIdService.get(itemRoute.id, watchedGroup?.route.id).pipe(
          mapToFetchState(),
          mapStateData(itemData =>
            isCurrentUserThreadParticipant && itemData.permissions.canRequestHelp
            || !!watchedGroup && allowsWatchingAnswers(itemData.permissions)
          ),
        ),
      ),
    ),
  );

  constructor(
    private threadService: ThreadService,
    private discussionService: DiscussionService,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private userService: GetUserService,
    private getItemByIdService: GetItemByIdService,
    private actionFeedbackService: ActionFeedbackService,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.state$.pipe(
      readyData(),
      withLatestFrom(this.discussionService.visible$),
      filter(([ events, visible ]) => visible && events.length > 0),
      delay(0),
      takeUntil(this.destroyed$),
    ).subscribe(() => this.scrollDown());

    this.isThreadStatusOpened$.pipe(delay(0), takeUntil(this.destroyed$)).subscribe(isThreadStatusOpened => {
      if (!isThreadStatusOpened) {
        this.form.get('messageToSend')?.disable();
        return;
      }
      this.form.get('messageToSend')?.enable();
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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

  changeThreadStatus(): void {
    this.actionFeedbackService.error($localize`Not implemented`);
  }
}
