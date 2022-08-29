import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { appConfig } from 'src/app/shared/helpers/config';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import {
  catchError,
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
  switchMap,
} from 'rxjs';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

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
type ThreadStatus = D.TypeOf<typeof threadStatusDecoder>;

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

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {

  events$: Observable<ThreadEvent[]>;
  status$: Observable<ThreadStatus['status']>;

  private newEvents$: Observable<ThreadEvent[]>;
  private clearEvents$ = new ReplaySubject<void>(1);
  private tokenData?: TokenData;
  private socket: WebSocketSubject<unknown>;

  constructor(
    private activityLogService: ActivityLogService,
    private actionFeedbackService: ActionFeedbackService,
    private http: HttpClient,
  ) {
    if (!appConfig.forumServerUrl) throw new Error('cannot instantiate threads service when no forum server url');
    this.socket = webSocket(appConfig.forumServerUrl);

    this.newEvents$ = this.socket.pipe(
      decodeSnakeCase(D.array(threadEventDecoder)),
      catchError(() => EMPTY), // ignore undecoded messages
    );

    this.events$ = this.clearEvents$.pipe(
      switchMap(() => this.newEvents$.pipe(
        startWith([]),
        scan((oldEvents, newEvents) => [ ...oldEvents, ...newEvents ]),
      )),
      map(events => events.sort((a, b) => a.time.valueOf() - b.time.valueOf())), // sort by date ascending
    );

    this.status$ = merge(
      // When re-initializing a thread, fetch the status since the last 20 events might not contain any thread-status related event.
      this.clearEvents$.pipe(switchMap(() => this.getStatus())),
      this.newEvents$.pipe(
        // when receiving a thread-status related event, we consider the first one since the list is ordered by event time DESCendings
        map(events => events.find(event => event.eventType === 'thread_opened' || event.eventType === 'thread_closed')),
        // Then we map the new status
        map((event): ThreadStatus['status'] | undefined => {
          switch (event?.eventType) {
            case 'thread_closed': return 'closed';
            case 'thread_opened': return 'opened';
            default: return undefined;
          }
        }),
        filter(isNotUndefined),
      ),
    ).pipe(
      distinctUntilChanged(),
      shareReplay(1),
    );
  }

  ngOnDestroy(): void {
    this.socket.complete();
  }

  init(tokenData: TokenData): void {
    this.tokenData = tokenData;
    this.clearEvents$.next();
  }

  private send(action: ThreadAction): void {
    if (!this.tokenData) throw new Error('service must be initialized');
    this.socket.next({
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

  follow(): void {
    this.send({ action: 'follow' });
  }

  unfollow(): void {
    this.send({ action: 'unfollow' });
  }

  sendMessage(message: string): void {
    if (!message) throw new Error('Cannot send an empty message');
    this.send({ action: 'send-message', message });
  }

  private getStatus(): Observable<ThreadStatus['status']> {
    if (!appConfig.forumApiUrl) throw new Error('cannot call forum api');

    return this.http.post(`${appConfig.forumApiUrl}/thread-status`, { token: this.tokenData }).pipe(
      decodeSnakeCase(threadStatusDecoder),
      catchError(() => EMPTY),
      map(result => result.status),
    );
  }

}
