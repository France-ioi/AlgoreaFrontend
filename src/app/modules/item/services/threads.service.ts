import { Injectable, OnDestroy } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { appConfig } from 'src/app/shared/helpers/config';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge,
  Observable,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  SubscriptionLike,
  switchMap,
  take,
} from 'rxjs';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ForumService } from './forum.service';

const threadOpenedEventDecoder = D.struct({
  eventType: D.literal('thread_opened'),
  byUserId: D.string,
});

const threadClosedEventDecoder = D.struct({
  eventType: D.literal('thread_closed'),
  byUserId: D.string,
});

const followEventDecoder = D.struct({
  eventType: D.literal('follow'),
  userId: D.string,
});

const unfollowEventDecoder = D.struct({
  eventType: D.literal('unfollow'),
  userId: D.string,
});

const attemptStartedEventDecoder = D.struct({
  eventType: D.literal('attempt_started'),
  attemptId: D.string,
});

const submissionEventDecoder = pipe(
  D.struct({
    eventType: D.literal('submission'),
    attemptId: D.string,
    answerId: D.string,
  }),
  D.intersect(D.partial({
    score: D.number,
    validated: D.boolean,
  }))
);

const messageEventDecoder = D.struct({
  eventType: D.literal('message'),
  userId: D.string,
  content: D.string,
});

const threadEventDecoder = pipe(
  D.struct({ time: dateDecoder }),
  D.intersect(D.union(
    threadOpenedEventDecoder,
    threadClosedEventDecoder,
    followEventDecoder,
    attemptStartedEventDecoder,
    submissionEventDecoder,
    unfollowEventDecoder,
    messageEventDecoder,
  )),
);
type ThreadEvent = D.TypeOf<typeof threadEventDecoder>;

const threadStatusDecoder = D.struct({
  status: D.literal('none', 'closed', 'opened'),
});

interface TokenData {
  participantId: string,
  itemId: string,
  userId: string,
  isMine: boolean,
  canWatchParticipant: boolean,
}

type ThreadAction =
  | { action: 'open-thread', history: ActivityLog[] }
  | { action: 'close-thread' }
  | { action: 'follow' }
  | { action: 'unfollow' }
  | { action: 'thread-status' }
  | { action: 'send-message', message: string };

export enum ThreadState {
  ConnectionClosed = 'connection_closed',
  ThreadStatusPending = 'thread_status_pending',
  ThreadOpened = 'thread_opened',
  ThreadClosed = 'thread_closed',
}

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {

  private clearEvents$ = new ReplaySubject<void>(1);
  private tokenData?: TokenData;

  private threadSub?: SubscriptionLike;

  events$ = this.clearEvents$.pipe(
    switchMap(() => this.newEvents$.pipe(
      startWith([]),
      scan((oldEvents, newEvents) => [ ...oldEvents, ...newEvents ]),
    )),
    map(events => events.sort((a, b) => a.time.valueOf() - b.time.valueOf())), // sort by date ascending
  );

  private newEvents$: Observable<ThreadEvent[]> = this.forumService.inputMessages$.pipe(
    decodeSnakeCase(D.array(threadEventDecoder)),
    catchError(() => EMPTY), // ignore undecoded messages
  );

  private threadStatus$ = merge(
    // When re-initializing a thread, fetch the status since the last 20 events might not contain any thread-status related event.
    this.clearEvents$.pipe(switchMap(() => this.getStatus().pipe(startWith('initializing' as const)))),
    this.newEvents$.pipe(
      // when receiving a thread-status related event, we consider the first one since the list is ordered by event time DESCendings
      map(events => events.find(event => event.eventType === 'thread_opened' || event.eventType === 'thread_closed')),
      // Then we map the new status
      map((event): 'closed' | 'opened' | undefined => {
        switch (event?.eventType) {
          case 'thread_closed': return 'closed' as const;
          case 'thread_opened': return 'opened' as const;
          default: return undefined;
        }
      }),
      filter(isNotUndefined),
    ),
  ).pipe(
    distinctUntilChanged(),
    shareReplay(1),
  );

  state$: Observable<ThreadState> = combineLatest([ this.forumService.isWsOpen$, this.threadStatus$ ]).pipe(
    map(([ wsOpened, threadStatus ]) => {
      if (!wsOpened) return ThreadState.ConnectionClosed;
      if (threadStatus === 'initializing') return ThreadState.ThreadStatusPending;
      if (threadStatus === 'closed') return ThreadState.ThreadClosed;
      return ThreadState.ThreadOpened;
    })
  );

  constructor(
    private forumService: ForumService,
    private activityLogService: ActivityLogService,
    private actionFeedbackService: ActionFeedbackService,
    private http: HttpClient,
  ) {}

  ngOnDestroy(): void {
    this.clearEvents$.complete();
    this.threadSub?.unsubscribe();
  }

  setThread(tokenData: TokenData): void {
    if (this.tokenData) throw new Error('"leaveThread" should be called before setThread when changing thread');
    this.tokenData = tokenData;
    this.clearEvents$.next();
    this.threadSub?.unsubscribe();
    // send 'follow' each time the ws is reopened
    this.threadSub = this.forumService.isWsOpen$.pipe(filter(open => open)).subscribe(() => this.sendFollow());
  }

  leaveThread(): void {
    this.threadSub?.unsubscribe();
    this.tokenData = undefined;
    // send 'unfollow' only if the ws is open
    this.threadSub = this.forumService.isWsOpen$.pipe(take(1), filter(open => open)).subscribe(() => this.sendUnfollow());
  }

  private send(action: ThreadAction): void {
    if (!this.tokenData) throw new Error('service must be initialized');
    this.forumService.send({
      token: this.tokenData,
      ...action,
    });
  }

  open(onDoneOrError: () => void): void {
    if (!this.tokenData) throw new Error('cannot open thread without token data');

    const { participantId, userId, itemId } = this.tokenData;
    const watchedGroupId = participantId === userId ? undefined : participantId;

    this.clearEvents$.next();
    this.activityLogService.getActivityLog(itemId, watchedGroupId).subscribe({
      next: history => {
        this.send({ action: 'open-thread', history });
        onDoneOrError();
      },
      error: err => {
        onDoneOrError();
        this.actionFeedbackService.error($localize`We could not open a thread, please retry. If the problem persists, contact us`);
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  close(): void {
    this.send({ action: 'close-thread' });
  }

  private sendFollow(): void {
    this.send({ action: 'follow' });
  }

  private sendUnfollow(): void {
    this.send({ action: 'unfollow' });
  }

  sendMessage(message: string): void {
    if (!message) throw new Error('Cannot send an empty message');
    this.send({ action: 'send-message', message });
  }

  private getStatus(): Observable<'closed' | 'opened'> {
    if (!appConfig.forumApiUrl) throw new Error('cannot call forum api');

    return this.http.post(`${appConfig.forumApiUrl}/thread-status`, { token: this.tokenData }).pipe(
      decodeSnakeCase(threadStatusDecoder),
      catchError(() => EMPTY),
      map(result => (result.status === 'opened' ? 'opened' as const : 'closed' as const)),
    );
  }

}
