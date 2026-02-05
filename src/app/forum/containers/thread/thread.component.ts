import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapToFetchState, readyData } from '../../../utils/operators/state';
import { delay, combineLatest, of, switchMap, Observable, Subscription, BehaviorSubject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeScan,
  scan,
  share,
  startWith,
  take,
} from 'rxjs/operators';
import { UserSessionService } from '../../../services/user-session.service';
import { formatUser } from 'src/app/groups/models/user';
import { GetUserService } from 'src/app/groups/data-access/get-user.service';
import { UserInfo } from '../thread-message/thread-user-info';
import { GetItemByIdService } from '../../../data-access/get-item-by-id.service';
import { ActionFeedbackService } from '../../../services/action-feedback.service';
import { FetchState, fetchingState, readyState } from '../../../utils/state';
import { errorIsHTTPForbidden } from '../../../utils/errors';
import { UpdateThreadService } from '../../../data-access/update-thread.service';
import { LetDirective } from '@ngrx/component';
import { ThreadMessageComponent } from '../thread-message/thread-message.component';
import { AsyncPipe } from '@angular/common';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { fromWebsocket } from 'src/app/store/websocket';
import { ThreadId } from 'src/app/forum/models/threads';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { isNotNull, isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { fromObservation } from 'src/app/store/observation';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { AutoResizeDirective } from 'src/app/directives/auto-resize.directive';
import { fromItemContent } from 'src/app/items/store';
import { fromGroupContent } from 'src/app/groups/store';
import equal from 'fast-deep-equal/es6';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';
import { HttpErrorResponse } from '@angular/common/http';
import { isMessageEvent } from '../../models/thread-events';
import { v4 as uuidv4 } from 'uuid';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ThreadUserIndicatorComponent } from '../thread-user-indicator/thread-user-indicator.component';
import { fromForum as forumActions } from '../../store';
import { mergeEvents, ThreadEvent } from '../../models/thread-events';
import { computed } from '@angular/core';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';

const selectThreadInfo = createSelector(
  fromItemContent.selectActiveContentItem,
  fromGroupContent.selectObservationInfoForFetchedContent,
  fromForum.selectThreadStatus,
  (item, observationInfo, threadStatus) => ({
    threadStatus,
    itemInfo: threadStatus?.id.itemId === item?.id ? item : null,
    groupInfo: observationInfo && threadStatus?.id.participantId === observationInfo.data?.route.id ? observationInfo.data : null,
  })
);

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
  imports: [
    ThreadMessageComponent,
    LetDirective,
    FormsModule,
    ReactiveFormsModule,
    ItemRoutePipe,
    AsyncPipe,
    ButtonIconComponent,
    ButtonComponent,
    AutoResizeDirective,
    TooltipDirective,
    ThreadUserIndicatorComponent,
    LoadingComponent,
    ErrorComponent,
  ]
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  private config = inject(APPCONFIG);
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('messageToSendEl') messageToSendEl?: ElementRef<HTMLTextAreaElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });
  disableControls$ = new BehaviorSubject<boolean>(false);

  readonly subscriptions = new Subscription();

  // Select individual event sources
  private readonly logEvents = this.store.selectSignal(fromForum.selectLogEvents);
  private readonly slsEvents = this.store.selectSignal(fromForum.selectSlsEvents);
  private readonly wsEvents = this.store.selectSignal(fromForum.selectWsEvents);

  // Merge events with granular loading states
  readonly state = computed(() => {
    const log = this.logEvents();
    const sls = this.slsEvents();
    const ws = this.wsEvents();
    const identifier = log.identifier ?? sls.identifier;

    // Return error if either source has an error
    if (log.isError) return log;
    if (sls.isError) return sls;

    // Check if both are loading (initial load)
    const bothFetching = log.isFetching && sls.isFetching;
    const bothHaveNoData = log.data === undefined && sls.data === undefined;

    if (bothFetching && bothHaveNoData) {
      return fetchingState<ThreadEvent[], ThreadId>(undefined, identifier);
    }

    // At least one has data - merge what we have
    const logData = log.data ?? [];
    const slsData = sls.data ?? [];
    const mergedData = mergeEvents([ logData, slsData, ws ]);

    // If either is still fetching, mark as fetching but with data
    if (log.isFetching || sls.isFetching) {
      return fetchingState(mergedData, identifier);
    }

    return readyState(mergedData, identifier);
  });

  // Observable version for backwards compatibility
  private readonly state$ = this.store.select(fromForum.selectMergedThreadEvents);

  // Computed signals for granular loading states
  readonly isLoadingActivities = computed(() => this.logEvents().isFetching);
  readonly isLoadingMessages = computed(() => this.slsEvents().isFetching);
  readonly hasActivitiesData = computed(() => this.logEvents().data !== undefined);
  readonly hasMessagesData = computed(() => this.slsEvents().data !== undefined);

  readonly isWsOpen$ = this.store.select(fromWebsocket.selectOpen);

  private distinctUsersInThread = this.state$.pipe(
    map(state => state.data ?? []), // if there is no data, consider there is no events
    map(events => events.filter(isMessageEvent).map(e => e.authorId)),
    scan((acc: string[], val) => [ ...new Set([ ...acc, ...val ]) ].sort() , []),
    startWith([]),
    distinctUntilChanged((prev, cur) => JSON.stringify(prev) === JSON.stringify(cur))
  );
  readonly userCache$ = combineLatest([
    this.store.select(fromForum.selectThreadId).pipe(filter(isNotNull)),
    this.distinctUsersInThread,
    this.userSessionService.userProfile$,
    this.store.select(fromObservation.selectObservedGroupInfo),
  ]).pipe(
    map(([ threadId, users, currentUser, observedGroup ]) =>
      [ threadId.participantId, ...users.filter(id => threadId.participantId !== id) ].map(id => ({
        id,
        isCurrentUser: id === currentUser.groupId,
        isThreadParticipant: id === observedGroup?.route.id || (!observedGroup && id === currentUser.groupId),
        name: id === currentUser.groupId ? formatUser(currentUser) : id === observedGroup?.route.id ? observedGroup.name : undefined,
      })),
    ),
    mergeScan((acc: UserInfo[], users) => combineLatest(users.map(u => {
      if (u.name !== undefined) return of(u);
      const lookup = acc.find(user => user.id === u.id);
      if (lookup?.name !== undefined) return of(lookup);
      return this.userService.getForId(u.id).pipe(
        map(user => ({ ...u, name: formatUser(user) })),
        startWith(u),
        catchError(() => of(u)),
      );
    })), [] /* scan seed */, 1 /* no concurrency */),
  );
  isMine$ = combineLatest([
    this.store.select(fromForum.selectThreadId).pipe(filter(isNotNull)),
    this.userSessionService.userProfile$,
  ]).pipe(map(([ threadId, userProfile ]) => threadId.participantId === userProfile.groupId));
  readonly participantUser$ = combineLatest([
    this.userCache$,
    this.store.select(fromForum.selectThreadId),
  ]).pipe(
    map(([ users, threadId ]) => users.find(u => u.id === threadId?.participantId)),
  );
  // for future: others should be able to load as well using the answer stored in msg data
  readonly canCurrentUserLoadAnswers$ = this.store.select(fromForum.selectCanCurrentUserLoadThreadAnswers);
  private readonly isThreadStatusOpened$ = this.store.select(fromForum.selectThreadStatusOpen);
  readonly isCurrentUserThreadParticipant$ = combineLatest([
    this.userSessionService.userProfile$,
    this.store.select(fromForum.selectThreadId),
  ]).pipe(
    map(([ user, threadId ]) => user.groupId === threadId?.participantId)
  );
  readonly threadStatus$ : Observable<undefined | FetchState<
  { open: true, canClose: boolean } |
  { open: false, canOpen: boolean }
  >> = combineLatest([
      this.store.select(selectThreadInfo),
      this.isCurrentUserThreadParticipant$,
    ]).pipe(
      debounceTime(0), // to prevent race condition (service call immediately aborted)
      distinctUntilChanged(([ prev ], [ cur ]) => equal(prev.threadStatus, cur.threadStatus)),
      switchMap(([{ threadStatus, itemInfo, groupInfo }, isCurrentUserParticipant ]) => {
        if (!threadStatus || !threadStatus?.visible) return of(undefined);
        const { id, open } = threadStatus;
        if (open) return of(readyState({ open: true as const, canClose: isCurrentUserParticipant }));
        // if we have the info, decided without more fetching
        if (isCurrentUserParticipant && itemInfo) {
          return of(readyState({ open: false as const, canOpen: itemInfo.permissions.canRequestHelp }));
        }
        if (groupInfo) {
          return of(readyState({ open: false as const, canOpen: groupInfo.currentUserWatchGroup }));
        }
        // if we do not have the info ready, we have to fetch
        return this.getItemByIdService.get(id.itemId, isCurrentUserParticipant ? {} : { watchedGroupId: id.participantId }).pipe(
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
  threadId$ = this.store.select(fromForum.selectThreadId);
  threadToken = this.store.selectSignal(fromForum.selectThreadToken);
  readonly followStatus$ = this.store.select(fromForum.selectFollowStatus);

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
    private userService: GetUserService,
    private getItemByIdService: GetItemByIdService,
    private actionFeedbackService: ActionFeedbackService,
    private updateThreadService: UpdateThreadService,
    private forumWebsocketClient: WebsocketClient,
    private threadMessageService: ThreadMessageService,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.state$.pipe(
        readyData(),
        filter(events => events.length > 0),
        delay(0),
      ).subscribe(() => this.scrollDown())
    );

    this.subscriptions.add(
      combineLatest([
        this.threadStatus$.pipe(delay(0)),
        this.disableControls$,
      ]).subscribe(([ status, disableControls ]) => {
        if (status?.data && (status.data.open || status.data.canOpen) && !disableControls) {
          this.form.get('messageToSend')?.enable();
          this.focusOnInput();
        } else {
          this.form.get('messageToSend')?.disable();
        }
      })
    );
    this.subscriptions.add(
      this.isThreadStatusOpened$.pipe(delay(0), filter(isThreadStatusOpened => isThreadStatusOpened)).subscribe(() =>
        this.messageToSendEl?.nativeElement.focus()
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  clearMessageToSendControl(): void {
    this.form.reset({
      messageToSend: '',
    });
  }

  sendMessage(threadId: ThreadId, isThreadOpened: boolean): void {
    const messageToSend = this.form.value.messageToSend?.trim();
    if (!messageToSend) return;
    this.disableControls$.next(true);

    const token = this.threadToken();
    if (!token) throw new Error('unexpected: the thread token is empty');

    const uuid = uuidv4(); // used to track a message if we need to (future use)
    const prerequisite = isThreadOpened ? of(undefined) : this.changeThreadStatus({ open: true, threadId, messageCountIncrement: 1 }).pipe(
      switchMap(() => this.store.select(fromForum.selectThreadStatusOpen)),
      filter(open => open),
      take(1),
      map(() => undefined)
    );
    prerequisite.pipe(
      switchMap(() => this.store.select(fromForum.selectThreadToken)),
      filter(isNotUndefined),
      take(1),
      switchMap(token =>
        this.threadMessageService.create(threadId.itemId, threadId.participantId, { text: messageToSend, uuid }, { authToken: token })
      ),
      switchMap(() => this.updateThreadService.update(threadId.itemId, threadId.participantId, { messageCountIncrement: 1 })),
    ).subscribe({
      next: () => {
        this.clearMessageToSendControl();
        this.disableControls$.next(false);
        // Auto-follow when sending a message (if not already following)
        this.store.dispatch(forumActions.threadPanelActions.autoFollowTriggered({ threadId }));
      },
      error: err => {
        this.disableControls$.next(false);
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  scrollDown(): void {
    if (!this.messagesScroll) return;

    this.messagesScroll.nativeElement.scrollTo(
      0,
      this.messagesScroll.nativeElement.scrollHeight - this.messagesScroll.nativeElement.offsetHeight
    );
  }

  changeThreadStatus(
    params: { open: true, threadId: ThreadId, messageCountIncrement?: number } | { open: false, threadId: ThreadId }
  ): Observable<void> {
    const update$ = this.updateThreadService.update(params.threadId.itemId, params.threadId.participantId, params.open ? {
      status: 'waiting_for_trainer',
      helperGroupId: this.config.allUsersGroupId,
      ...(params.messageCountIncrement !== undefined ? { messageCountIncrement: params.messageCountIncrement } : {})
    } : { status: 'closed' }).pipe(share());
    update$.subscribe({
      next: () => this.store.dispatch(fromForum.threadPanelActions.threadStatusChanged()),
      error: () => this.actionFeedbackService.unexpectedError(),
    });
    return update$;
  }

  focusOnInput(): void {
    this.messageToSendEl?.nativeElement.focus();
  }

  onFollowChanged(threadId: ThreadId, follow: boolean): void {
    this.store.dispatch(forumActions.followStatusUiActions.followToggled({ threadId, follow }));
  }
}
