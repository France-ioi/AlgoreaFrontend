import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ThreadId, ThreadService } from '../../../modules/item/services/threads.service';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { mapToFetchState, readyData } from '../../../shared/operators/state';
import { filter, delay, combineLatest, of, switchMap, Observable, Subscription } from 'rxjs';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { catchError, debounceTime, distinctUntilChanged, map, mergeScan, scan, startWith, withLatestFrom } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { formatUser } from 'src/app/shared/helpers/user';
import { GetUserService } from 'src/app/modules/group/http-services/get-user.service';
import { UserInfo } from '../thread-message/thread-user-info';
import { rawItemRoute } from 'src/app/shared/routing/item-route';
import { GetItemByIdService } from '../../../modules/item/http-services/get-item-by-id.service';
import { ActionFeedbackService } from '../../../shared/services/action-feedback.service';
import { FetchState, fetchingState, readyState } from '../../../shared/helpers/state';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { UpdateThreadService } from '../../../modules/item/http-services/update-thread.service';
import { environment } from '../../../../environments/environment';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { LetDirective } from '@ngrx/component';
import { ThreadMessageComponent } from '../thread-message/thread-message.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

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
    ButtonModule,
    TooltipModule,
    AsyncPipe,
  ],
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('messageToSendEl') messageToSendEl?: ElementRef<HTMLTextAreaElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  readonly subscriptions = new Subscription();
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
    readyData(),
    map(t => t?.isMine || t?.canWatch), // for future: others should be able to load as well using the answer stored in msg data
  );
  readonly itemRoute$ = this.threadService.threadInfo$.pipe(
    readyData(),
    map(t => (t ? rawItemRoute('activity', t.itemId) : undefined)),
  );
  private readonly isThreadStatusOpened$ = this.threadService.threadInfo$.pipe( // may be true, false or undefined!
    map(t => (t.data ? [ 'waiting_for_participant', 'waiting_for_trainer' ].includes(t.data.status) : undefined)),
  );
  private readonly isCurrentUserThreadParticipant$ = combineLatest([
    this.userSessionService.userProfile$,
    this.threadService.threadId$
  ]).pipe(
    map(([ user, threadId ]) => user.groupId === threadId?.participantId)
  );
  readonly threadStatus$ : Observable<undefined | FetchState<
    { open: true, canClose: boolean } |
    { open: false, canOpen: boolean }
  >> = combineLatest([
      this.isThreadStatusOpened$,
      this.isCurrentUserThreadParticipant$,
      this.threadService.threadId$,
      this.discussionService.visible$,
    ]).pipe(
      debounceTime(0), // to prevent race condition (service call immediately aborted)
      switchMap(([ open, isCurrentUserParticipant, threadId, visible ]) => {
        if (!visible || open === undefined || !threadId) return of(undefined);
        if (open) return of(readyState({ open: true as const, canClose: isCurrentUserParticipant }));
        return this.getItemByIdService.get(threadId.itemId, isCurrentUserParticipant ? undefined : threadId.participantId).pipe(
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
  threadId$ = this.threadService.threadId$;

  constructor(
    private threadService: ThreadService,
    private discussionService: DiscussionService,
    private userSessionService: UserSessionService,
    private groupWatchingService: GroupWatchingService,
    private userService: GetUserService,
    private getItemByIdService: GetItemByIdService,
    private actionFeedbackService: ActionFeedbackService,
    private updateThreadService: UpdateThreadService,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.state$.pipe(
        readyData(),
        withLatestFrom(this.discussionService.visible$),
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
    this.threadService.sendMessage(messageToSend);
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
      helperGroupId: environment.allUsersGroupId,
    } : { status: 'closed' }).subscribe({
      next: () => this.threadService.refresh(),
      error: () => this.actionFeedbackService.unexpectedError(),
    });
  }
}
