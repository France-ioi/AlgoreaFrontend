import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapToFetchState, readyData } from '../../../utils/operators/state';
import { filter, delay, combineLatest, of, switchMap, Observable, Subscription, BehaviorSubject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
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
import { TooltipModule } from 'primeng/tooltip';
import { LetDirective } from '@ngrx/component';
import { ThreadMessageComponent } from '../thread-message/thread-message.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { WebsocketClient } from 'src/app/data-access/websocket-client.service';
import { isNotNull, isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { publishEventsAction } from '../../data-access/websocket-messages/threads-outbound-actions';
import { messageEvent } from '../../models/thread-events';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { fromObservation } from 'src/app/store/observation';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { AutoResizeDirective } from 'src/app/directives/auto-resize.directive';

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
    ItemRoutePipe,
    TooltipModule,
    AsyncPipe,
    RouterLink,
    ButtonIconComponent,
    ButtonComponent,
    AutoResizeDirective,
  ],
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
  readonly state$ = this.store.select(fromForum.selectThreadEvents);

  readonly isWsOpen$ = this.store.select(fromForum.selectWebsocketOpen);

  private distinctUsersInThread = this.state$.pipe(
    map(state => state.data ?? []), // if there is no data, consider there is no events
    map(events => events.map(e => e.createdBy)),
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
      this.store.select(fromForum.selectThreadStatus),
      this.isCurrentUserThreadParticipant$,
    ]).pipe(
      debounceTime(0), // to prevent race condition (service call immediately aborted)
      switchMap(([ threadStatus, isCurrentUserParticipant ]) => {
        if (!threadStatus || !threadStatus?.visible) return of(undefined);
        const { id, open } = threadStatus;
        if (open) return of(readyState({ open: true as const, canClose: isCurrentUserParticipant }));
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
  hasNoMessages$ = this.store.select(fromForum.selectThreadNoMessages);

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
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

    const threadToken$ = this.store.select(fromForum.selectThreadToken).pipe(
      take(1), // send on the current thread (if any) only
      filter(isNotUndefined),
    );

    if (isThreadOpened) {
      threadToken$.subscribe({
        next: token => this.forumWebsocketClient.send(publishEventsAction(token, [ messageEvent(messageToSend) ])),
        error: () => this.disableControls$.next(false),
      });
      threadToken$.pipe(
        switchMap(() =>
          this.updateThreadService.update(threadId.itemId, threadId.participantId, { messageCountIncrement: 1 })
        ),
      ).subscribe({
        next: () => {
          this.disableControls$.next(false);
          this.clearMessageToSendControl();
        },
        error: () => this.disableControls$.next(false)
      });
    } else {
      this.changeThreadStatus({
        open: true,
        threadId,
        messageCountIncrement: 1,
      }).subscribe({
        error: () => this.disableControls$.next(false),
      });
      this.subscriptions.add(
        this.store.select(fromForum.selectThreadStatusOpen).pipe(
          filter(isOpened => isOpened),
          take(1),
          switchMap(() => threadToken$)
        ).subscribe({
          next: token => {
            this.forumWebsocketClient.send(publishEventsAction(token, [ messageEvent(messageToSend) ]));
            this.clearMessageToSendControl();
            this.disableControls$.next(false);
          },
          error: () => this.disableControls$.next(false),
        })
      );
    }
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
}
