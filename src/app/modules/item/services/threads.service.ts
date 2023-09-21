import { Injectable, OnDestroy } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { decode, decodeOrNull } from 'src/app/shared/helpers/decoders';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
  distinctUntilChanged,
  EMPTY,
  filter,
  fromEvent,
  map,
  Observable,
  of,
  pairwise,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  Subscription,
  switchMap,
  take,
  tap
} from 'rxjs';
import { ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { isNotNull, isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ForumService } from './forum.service';
import { publishEventsAction, subscribeAction, unsubscribeAction } from './threads-outbound-actions';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { messageEvent } from './threads-events';
import { IncomingThreadEvent, incomingThreadEventDecoder } from './threads-inbound-events';
import { ThreadService as ThreadHttpService } from '../http-services/thread.service';


interface ThreadId {
  itemId: string,
  participantId: string,
}

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {

  private configuredThreadId = new BehaviorSubject<ThreadId|null>(null);
  private clearEvents$ = new ReplaySubject<void>(1);

  threadId$ = this.configuredThreadId.pipe(distinctUntilChanged((x,y) => x?.participantId === y?.participantId && x?.itemId === y?.itemId));
  threadInfo$ = combineLatest([
    this.threadId$,
    fromEvent(window, 'beforeunload').pipe(map(() => true), startWith(false)),
  ]).pipe(
    switchMap(([ threadId, unloading ]) => {
      // window is unloading -> no thread anymore
      if (unloading) return of(undefined);
      if (!threadId) return of(undefined);
      return this.threadHttpService.get(threadId.itemId, threadId.participantId);
    }),
    startWith(undefined),
    shareReplay(1),
  );
  private threadSubscriptionSub = this.threadInfo$.pipe(
    map(t => t?.token),
    pairwise(),
    switchMap(([ prevToken, newToken ]) => concat(...[
      // if there was a thread before: if the WS connection is open, emit unsubscribe once
      ...(prevToken ? [ this.forumService.isWsOpen$.pipe(take(1), filter(open => open), map(() => unsubscribeAction(prevToken))) ] : []),
      // if there is a new thread: each time the WS reopen, send a subscribe
      ...(newToken ? [ this.forumService.isWsOpen$.pipe(filter(open => open), map(() => subscribeAction(newToken))) ] : [])
    ])),
  ).subscribe(msg => {
    this.clearEvents$.next();
    this.forumService.send(msg); // send the subscribe or unsubscribe
  });

  private incomingEvents$: Observable<IncomingThreadEvent[]> = this.forumService.inputMessages$.pipe(
    // if the incoming message is not array, just ignore it. Otherwise return a list of messages which we were able to decode as events
    map(message => decode(D.UnknownArray)(message).map(e => decodeOrNull(incomingThreadEventDecoder)(e)).filter(isNotNull)),
    catchError(() => EMPTY), // ignore undecoded messages
  );

  eventsState$ = this.clearEvents$.pipe(
    startWith(undefined),
    switchMap(() => this.incomingEvents$.pipe(
      scan((acc, newEvents) => [ ...acc, ...newEvents ]),
      map(events => events
        .sort((a, b) => a.time.valueOf() - b.time.valueOf()) // sort by date ascending
        .filter((el, i, list) => el.time.valueOf() !== list[i-1]?.time.valueOf()) // remove duplicate (using time as differentiator)
      ),
      mapToFetchState(),
    )),
    shareReplay(1),
  );

  private subscriptions = new Subscription();

  constructor(
    private forumService: ForumService,
    private activityLogService: ActivityLogService,
    private threadHttpService: ThreadHttpService,
  ) {}

  ngOnDestroy(): void {
    this.configuredThreadId.complete();
    this.clearEvents$.complete();
    this.threadSubscriptionSub.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  /**
   * Sync events from the backend "event log" service with the forum events
   */
  syncEvents(): Observable<void> {
    return this.threadInfo$.pipe(
      take(1),
      filter(isNotUndefined),
      map(t => ({
        itemId: t.itemId,
        watchedGroupId: t.isMine ? undefined : t.participantId,
        token: t.token,
      })),
      switchMap(({ itemId, watchedGroupId, token }) => this.activityLogService.getActivityLog(itemId, { watchedGroupId, limit: 100 }).pipe(
        map(log => log.map(e => {
          switch (e.activityType) {
            case 'result_started': return { label: 'result_started' as const, time: e.at.valueOf(), data: { attemptId: e.attemptId } };
            case 'submission': {
              if (!e.answerId) return null;
              const { attemptId, answerId, at, score } = e;
              return { label: 'submission' as const, time: at.valueOf(), data: { attemptId, answerId, score } };
            }
            default: return null;
          }
        }).filter(isNotNull)),
        map(log => ({ log, token })),
      )),
      tap(({ log, token }) => {
        this.forumService.send(publishEventsAction(token, log));
      }),
      map(() => undefined),
    );
  }

  sendMessage(message: string): void {
    if (!message) throw new Error('Cannot send an empty message');
    this.subscriptions.add(
      this.threadInfo$.pipe(
        take(1), // send on the current thread (if any) only
        filter(isNotUndefined),
        map(t => t.token),
      ).subscribe(token => this.forumService.send(publishEventsAction(token, [ messageEvent(message) ])))
    );
  }

  setThread(thread: ThreadId|null): void {
    this.configuredThreadId.next(thread);
  }

}
