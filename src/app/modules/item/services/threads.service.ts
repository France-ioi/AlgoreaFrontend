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
  Observable,
  scan,
  shareReplay,
  startWith,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { ActivityLog, ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';

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
type ThreadEventMessage = D.TypeOf<typeof threadEventDecoder>;
const isThreadEventMessage = (value: unknown): value is ThreadEventMessage => typeof value === 'object' && !!value && 'eventType' in value;

const threadStatusDecoder = D.struct({
  status: D.literal('none', 'closed', 'opened'),
});

type ThreadStatusMessage = D.TypeOf<typeof threadStatusDecoder>;
const isThreadStatusMessage = (message: ThreadMessage): message is ThreadStatusMessage => !isThreadEventMessage(message);

const threadMessageDecoder = D.union(threadEventDecoder, threadStatusDecoder);
export type ThreadMessage = D.TypeOf<typeof threadMessageDecoder>;

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

  events$: Observable<ThreadEventMessage[]>;
  status$: Observable<ThreadStatusMessage['status']>;

  private newEvents$: Observable<ThreadEventMessage[]>;
  private clearEvents$ = new Subject<void>();
  private tokenData?: TokenData;
  private socket: WebSocketSubject<unknown>;
  private incomingMessages$: Observable<ThreadMessage[]>;
  private subscriptions: Subscription[] = [];

  constructor(
    private activityLogService: ActivityLogService,
  ) {
    if (!appConfig.forumServerUrl) throw new Error('cannot instantiate threads service when no forum server url');
    this.socket = webSocket(appConfig.forumServerUrl);

    this.incomingMessages$ = this.socket.pipe(
      decodeSnakeCase(D.array(threadMessageDecoder)),
      catchError(() => EMPTY), // ignore undecoded messages
    );

    this.newEvents$ = this.incomingMessages$.pipe(map(messages => messages.filter(isThreadEventMessage)));

    this.events$ = this.clearEvents$.pipe(
      startWith(undefined),
      switchMap(() => this.newEvents$.pipe(scan((oldEvents, newEvents) => [ ...oldEvents, ...newEvents ]))),
      map(messages => messages.sort((a, b) => a.time.valueOf() - b.time.valueOf())), // sort by date ascending
    );

    this.status$ = this.incomingMessages$.pipe(
      map(messages => messages.find(isThreadStatusMessage)?.status),
      filter(isNotUndefined),
      distinctUntilChanged(),
      shareReplay(1),
    );

    this.subscriptions.push(
      // Every time we receive an event related to thread status, refetch the status.
      this.newEvents$.pipe(
        map(events => events.find(event => event.eventType === 'thread_opened' || event.eventType === 'thread_closed')),
        filter(isNotUndefined),
      ).subscribe(() => this.getStatus()),
    );
  }

  ngOnDestroy(): void {
    this.socket.complete();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  init(tokenData: TokenData): void {
    this.tokenData = tokenData;
    this.clearEvents$.next(); // when re-initializing the service, clear event list.
    this.getStatus();
  }

  private send(action: ThreadAction): void {
    if (!this.tokenData) throw new Error('service must be initialized');
    this.socket.next({
      token: this.tokenData,
      ...action,
    });
  }

  open(): void {
    if (!this.tokenData) throw new Error('cannot open thread without token data');

    const { participantId, userId, itemId } = this.tokenData;
    const watchedGroupId = participantId === userId ? undefined : participantId;

    this.clearEvents$.next();
    this.activityLogService.getActivityLog(itemId, watchedGroupId).subscribe({
      next: history => this.send({ action: 'open-thread', history }),
      error: () => { /* FIXME: What to do? */ }
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

  private getStatus(): void {
    this.send({ action: 'thread-status' });
  }

}
