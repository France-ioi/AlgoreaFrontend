import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapToFetchState, readyData } from '../../../utils/operators/state';
import { filter, delay, combineLatest, of, switchMap, Observable, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, mergeScan, scan, startWith, take, withLatestFrom } from 'rxjs/operators';
import { UserSessionService } from '../../../services/user-session.service';
import { GroupWatchingService } from '../../../services/group-watching.service';
import { formatUser } from 'src/app/models/user';
import { GetUserService } from 'src/app/groups/data-access/get-user.service';
import { UserInfo } from '../thread-message/thread-user-info';
import { GetItemByIdService } from '../../../data-access/get-item-by-id.service';
import { ActionFeedbackService } from '../../../services/action-feedback.service';
import { FetchState, fetchingState, readyState } from '../../../utils/state';
import { errorIsHTTPForbidden } from '../../../utils/errors';
import { UpdateThreadService } from '../../../data-access/update-thread.service';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { LetDirective } from '@ngrx/component';
import { ThreadMessageComponent } from '../thread-message/thread-message.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { appConfig } from 'src/app/utils/config';
import { Store } from '@ngrx/store';
import forum from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { isNotNull, isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { publishEventsAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { messageEvent } from '../../models/thread-events';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ThreadMessageComponent,
    LetDirective,
    FormsModule,
    ReactiveFormsModule,
    InputTextareaModule,
    RawItemRoutePipe,
    ButtonModule,
    TooltipModule,
    AsyncPipe,
    RouterLink,
  ],
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('messageToSendEl') messageToSendEl?: ElementRef<HTMLTextAreaElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  readonly subscriptions = new Subscription();
  readonly state$ = this.store.select(forum.selectThreadEvents);

  readonly isWsOpen$ = this.store.select(forum.selectWebsocketOpen);

  private distinctUsersInThread = this.state$.pipe(
    map(state => state.data ?? []), // if there is no data, consider there is no events
    map(events => events.map(e => e.createdBy)),
    scan((acc: string[], val) => [ ...new Set([ ...acc, ...val ]) ].sort() , []),
    startWith([]),
    distinctUntilChanged((prev, cur) => JSON.stringify(prev) === JSON.stringify(cur))
  );
  readonly userCache$ = combineLatest([
    this.store.select(forum.selectThreadId).pipe(filter(isNotNull)),
    this.distinctUsersInThread,
    this.userSessionService.userProfile$,
    this.groupWatchingService.watchedGroup$
  ]).pipe(
    map(([ threadId, users, currentUser, watchedGroup ]) =>
      [ threadId.participantId, ...users.filter(id => threadId.participantId !== id) ].map(id => ({
        id,
        isCurrentUser: id === currentUser.groupId,
        isThreadParticipant: id === watchedGroup?.route.id || (!watchedGroup && id === currentUser.groupId),
        name: id === currentUser.groupId ? formatUser(currentUser) : id === watchedGroup?.route.id ? watchedGroup.name : undefined,
      })),
    ),
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
  isMine$ = combineLatest([
    this.store.select(forum.selectThreadId).pipe(filter(isNotNull)),
    this.userSessionService.userProfile$,
  ]).pipe(map(([ threadId, userProfile ]) => threadId.participantId === userProfile.groupId));
  readonly participantUser$ = combineLatest([
    this.userCache$,
    this.store.select(forum.selectThreadId),
  ]).pipe(
    map(([ users, threadId ]) => users.find(u => u.id === threadId?.participantId)),
  );
  // for future: others should be able to load as well using the answer stored in msg data
  readonly canCurrentUserLoadAnswers$ = this.store.select(forum.selectCanCurrentUserLoadThreadAnswers);
  private readonly isThreadStatusOpened$ = this.store.select(forum.selectThreadStatusOpen);
  readonly isCurrentUserThreadParticipant$ = combineLatest([
    this.userSessionService.userProfile$,
    this.store.select(forum.selectThreadId),
  ]).pipe(
    map(([ user, threadId ]) => user.groupId === threadId?.participantId)
  );
  readonly threadStatus$ : Observable<undefined | FetchState<
    { open: true, canClose: boolean } |
    { open: false, canOpen: boolean }
  >> = combineLatest([
      this.store.select(forum.selectThreadStatus),
      this.isCurrentUserThreadParticipant$,
    ]).pipe(
      debounceTime(0), // to prevent race condition (service call immediately aborted)
      switchMap(([ threadStatus, isCurrentUserParticipant ]) => {
        if (!threadStatus || !threadStatus?.visible) return of(undefined);
        const { id, open } = threadStatus;
        if (open) return of(readyState({ open: true as const, canClose: isCurrentUserParticipant }));
        return this.getItemByIdService.get(id.itemId, isCurrentUserParticipant ? undefined : id.participantId).pipe(
          mapToFetchState(),
          map(state => {
            switch (state.tag) {
              case 'ready':
                if (isCurrentUserParticipant) return readyState({ open: false as const, canOpen: state.data.permissions.canRequestHelp });
                return readyState({ open: false as const, canOpen: true });
              case 'fetching':
                return fetchingState(); // fetching with no data
              case 'error':
                // 403 on that service means that they cannot watch the participant
                if (!isCurrentUserParticipant && errorIsHTTPForbidden(state.error)) {
                  return readyState({ open: false as const, canOpen: false });
                }
                return state;
            }
          })
        );
      }),
    );
  threadId$ = this.store.select(forum.selectThreadId);
  hasNoMessages$ = this.store.select(forum.selectThreadNoMessages);

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private userService: GetUserService,
    private getItemByIdService: GetItemByIdService,
    private actionFeedbackService: ActionFeedbackService,
    private updateThreadService: UpdateThreadService,
    private forumWebsocketClient: WebsocketClient,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.state$.pipe(
        readyData(),
        withLatestFrom(this.store.select(forum.selectVisible)),
        filter(([ events, visible ]) => visible && events.length > 0),
        delay(0),
      ).subscribe(() => this.scrollDown())
    );

    this.subscriptions.add(
      this.isThreadStatusOpened$.pipe(delay(0)).subscribe(isThreadStatusOpened => {
        if (!isThreadStatusOpened) {
          this.form.get('messageToSend')?.disable();
          return;
        }
        this.form.get('messageToSend')?.enable();
        this.messageToSendEl?.nativeElement.focus();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  sendMessage(threadId: ThreadId): void {
    const messageToSend = this.form.value.messageToSend?.trim();
    if (!messageToSend) return;
    this.store.select(forum.selectThreadToken).pipe(
      take(1), // send on the current thread (if any) only
      filter(isNotUndefined),
    ).subscribe(token => this.forumWebsocketClient.send(publishEventsAction(token, [ messageEvent(messageToSend) ])));
    this.updateThreadService.update(threadId.itemId, threadId.participantId, { messageCountIncrement: 1 }).subscribe();
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

  changeThreadStatus(open: boolean, threadId: ThreadId): void {
    this.updateThreadService.update(threadId.itemId, threadId.participantId, open ? {
      status: 'waiting_for_trainer',
      helperGroupId: appConfig.allUsersGroupId,
    } : { status: 'closed' }).subscribe({
      next: () => this.store.dispatch(forum.threadPanelActions.threadStatusChanged()),
      error: () => this.actionFeedbackService.unexpectedError(),
    });
  }
}
