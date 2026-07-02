import { AfterViewInit, Component, DestroyRef, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { readyData } from '../../../utils/operators/state';
import { delay, combineLatest, of, switchMap, Observable, BehaviorSubject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
} from 'rxjs/operators';
import { UserSessionService } from '../../../services/user-session.service';
import { UserResolutionCacheService } from 'src/app/groups/data-access/user-resolution-cache.service';
import { formatUser } from 'src/app/groups/models/user';
import { GetItemByIdService } from '../../../data-access/get-item-by-id.service';
import { ActionFeedbackService } from '../../../services/action-feedback.service';
import { FetchState } from '../../../utils/state';
import { UpdateThreadService } from '../../../data-access/update-thread.service';
import { LetDirective } from '@ngrx/component';
import { ThreadMessageComponent } from '../thread-message/thread-message.component';
import { AsyncPipe } from '@angular/common';
import { APPCONFIG } from 'src/app/config';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { fromWebsocket } from 'src/app/store/websocket';
import { ThreadId } from 'src/app/forum/models/threads';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { AutoResizeDirective } from 'src/app/directives/auto-resize.directive';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';
import { isMessageEvent } from '../../models/thread-events';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { IndicatorLayout, ThreadTopIndicatorComponent } from '../thread-top-indicator/thread-top-indicator.component';
import { fromForum as forumActions } from '../../store';
import { computed, input, signal } from '@angular/core';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { selectThreadAssignmentIndex, selectThreadRawStatus, truncateLabel } from './thread.selectors';
import { buildThreadStatus$, mergeThreadEventsState } from './thread-view-model';
import { changeAssignment, changeThreadStatus, sendThreadMessage, ThreadActionsDeps } from './thread-actions';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
  imports: [
    ThreadMessageComponent,
    LetDirective,
    FormsModule,
    ReactiveFormsModule,
    ItemRoutePipe,
    AsyncPipe,
    ButtonIconComponent,
    ButtonComponent,
    SelectionComponent,
    AutoResizeDirective,
    TooltipDirective,
    ThreadTopIndicatorComponent,
    LoadingComponent,
    ErrorComponent,
  ]
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  private store = inject(Store);
  private userSessionService = inject(UserSessionService);
  private userCache = inject(UserResolutionCacheService);
  private getItemByIdService = inject(GetItemByIdService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private updateThreadService = inject(UpdateThreadService);
  private threadMessageService = inject(ThreadMessageService);
  private fb = inject(FormBuilder);
  private config = inject(APPCONFIG);
  private destroyRef = inject(DestroyRef);
  messagesScroll = viewChild<ElementRef<HTMLDivElement>>('messagesScroll');
  messageToSendEl = viewChild<ElementRef<HTMLTextAreaElement>>('messageToSendEl');

  indicatorLayout = input<IndicatorLayout>('default');

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });
  disableControls$ = new BehaviorSubject<boolean>(false);

  private readonly isPageUnloading = signal(false);

  // Select individual event sources
  private readonly logEvents = this.store.selectSignal(fromForum.selectLogEvents);
  private readonly slsEvents = this.store.selectSignal(fromForum.selectSlsEvents);
  private readonly wsEvents = this.store.selectSignal(fromForum.selectWsEvents);

  // Merge events with granular loading states
  readonly state = computed(() => mergeThreadEventsState(
    this.logEvents(),
    this.slsEvents(),
    this.wsEvents(),
    this.isPageUnloading(),
  ));

  // Observable version for backwards compatibility
  private readonly state$ = this.store.select(fromForum.selectMergedThreadEvents);

  // Computed signals for granular loading states
  readonly isLoadingActivities = computed(() => this.logEvents().isFetching);
  readonly isLoadingMessages = computed(() => this.slsEvents().isFetching);
  readonly hasActivitiesData = computed(() => this.logEvents().data !== undefined);
  readonly hasMessagesData = computed(() => this.slsEvents().data !== undefined);

  private readonly isWsOpenRaw$ = this.store.select(fromWebsocket.selectOpen);

  // Delay showing WebSocket error to avoid flash on brief disconnections or page unload
  readonly isWsOpen$ = this.isWsOpenRaw$.pipe(
    switchMap(isOpen => {
      if (isOpen || this.isPageUnloading()) {
        return of(true);
      }
      // Wait 500ms before showing the error to avoid flash on brief disconnections
      return of(false).pipe(delay(500));
    })
  );

  threadId$ = this.store.select(fromForum.selectThreadId);
  readonly participantUser$ = this.threadId$.pipe(
    map(t => t?.participantId ?? null),
    distinctUntilChanged(),
    switchMap(id => (id === null
      ? of(undefined)
      : this.userCache.resolveUser(id).pipe(
        map(u => ({ id, name: u ? formatUser(u) : undefined })),
        startWith({ id, name: undefined as string | undefined }),
      ))),
  );
  isMine$ = combineLatest([
    this.threadId$.pipe(filter(isNotNull)),
    this.userSessionService.userProfile$,
  ]).pipe(map(([ threadId, userProfile ]) => threadId.participantId === userProfile.groupId));
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
  >> = buildThreadStatus$({
      store: this.store,
      getItemByIdService: this.getItemByIdService,
      isCurrentUserThreadParticipant$: this.isCurrentUserThreadParticipant$,
    });
  threadToken = this.store.selectSignal(fromForum.selectThreadToken);
  readonly followStatus$ = this.store.select(fromForum.selectFollowStatus);

  readonly assignmentItems$ = combineLatest([
    this.isMine$,
    this.participantUser$,
  ]).pipe(
    map(([ isMine, participantUser ]) => {
      const participantLabel = isMine ? $localize`You` : truncateLabel(participantUser?.name ?? '…', 12);
      return [
        { label: participantLabel, value: 'participant' as const },
        { label: $localize`Helpers`, value: 'helpers' as const },
      ];
    }),
  );
  readonly threadAssignmentIndex$ = this.store.select(selectThreadAssignmentIndex);
  readonly threadRawStatus$ = this.store.select(selectThreadRawStatus);
  readonly canCloseThread$ = this.threadStatus$.pipe(
    map(status => !!status?.data && status.data.open && status.data.canClose),
  );
  readonly isLastMessageByCurrentUser$ = combineLatest([
    this.state$,
    this.userSessionService.userProfile$,
  ]).pipe(
    map(([ state, user ]) => {
      const events = state.data ?? [];
      const lastMessage = [ ...events ].reverse().find(isMessageEvent);
      return !!lastMessage && lastMessage.authorId === user.groupId;
    }),
  );

  constructor() {
    // Track page unload to prevent error flashing when leaving the page
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  ngAfterViewInit(): void {
    this.state$.pipe(
      readyData(),
      filter(events => events.length > 0),
      delay(0),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.scrollDown());

    combineLatest([
      this.threadStatus$.pipe(delay(0)),
      this.disableControls$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([ status, disableControls ]) => {
      if (status?.data && (status.data.open || status.data.canOpen) && !disableControls) {
        this.form.get('messageToSend')?.enable();
        this.focusOnInput();
      } else {
        this.form.get('messageToSend')?.disable();
      }
    });

    this.isThreadStatusOpened$.pipe(
      delay(0),
      filter(isThreadStatusOpened => isThreadStatusOpened),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.messageToSendEl()?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleBeforeUnload = (): void => {
    this.isPageUnloading.set(true);
  };

  private threadActionsDeps(): ThreadActionsDeps {
    return {
      store: this.store,
      threadMessageService: this.threadMessageService,
      updateThreadService: this.updateThreadService,
      actionFeedbackService: this.actionFeedbackService,
      config: this.config,
    };
  }

  clearMessageToSendControl(): void {
    this.form.reset({
      messageToSend: '',
    });
  }

  sendMessage(threadId: ThreadId, isThreadOpened: boolean, isParticipant: boolean): void {
    sendThreadMessage({
      ...this.threadActionsDeps(),
      messageToSend: this.form.value.messageToSend ?? '',
      threadId,
      isThreadOpened,
      isParticipant,
      threadToken: this.threadToken(),
      setControlsDisabled: disabled => this.disableControls$.next(disabled),
      clearMessageToSend: () => this.clearMessageToSendControl(),
    });
  }

  scrollDown(): void {
    const messagesScroll = this.messagesScroll();
    if (!messagesScroll) return;

    messagesScroll.nativeElement.scrollTo(
      0,
      messagesScroll.nativeElement.scrollHeight - messagesScroll.nativeElement.offsetHeight
    );
  }

  changeThreadStatus(
    params: { open: boolean, threadId: ThreadId, isParticipant: boolean, messageCountIncrement?: number }
  ): Observable<void> {
    return changeThreadStatus({ ...this.threadActionsDeps(), params });
  }

  changeAssignment(index: number, threadId: ThreadId): void {
    changeAssignment({ ...this.threadActionsDeps(), index, threadId });
  }

  focusOnInput(): void {
    this.messageToSendEl()?.nativeElement.focus();
  }

  onFollowChanged(threadId: ThreadId, follow: boolean): void {
    this.store.dispatch(forumActions.followStatusUiActions.followToggled({ threadId, follow }));
  }
}
