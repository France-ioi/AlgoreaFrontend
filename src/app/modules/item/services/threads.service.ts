import { Injectable, OnDestroy } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { decode, decodeOrNull } from 'src/app/shared/helpers/decoders';
import {
  catchError,
  EMPTY,
  filter,
  map,
  Observable,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  SubscriptionLike,
  switchMap,
  take,
  tap
} from 'rxjs';
import { ActivityLogService } from 'src/app/shared/http-services/activity-log.service';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';
import { ForumService } from './forum.service';
import { publishEventsAction, SUBSCRIBE, ThreadAction, UNSUBSCRIBE } from './threads-outbound-actions';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { messageEvent } from './threads-events';
import { IncomingThreadEvent, incomingThreadEventDecoder } from './threads-inbound-events';
import { ItemPermWithWatch } from 'src/app/shared/models/domain/item-watch-permission';
import { RawItemRoute } from 'src/app/shared/routing/item-route';

interface ThreadInfo {
  participant: {
    id: string,
    name: string,
  },
  currentUserId: string,
  itemRoute: RawItemRoute,
  canWatchParticipant: boolean,
  contentWatchPermission: ItemPermWithWatch,
}

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {

  private clearEvents$ = new ReplaySubject<void>(1);
  threadInfo?: ThreadInfo;

  private threadSub?: SubscriptionLike;

  private incomingEvents$: Observable<IncomingThreadEvent[]> = this.forumService.inputMessages$.pipe(
    // if the incoming message is not array, just ignore it. Otherwise return a list of messages which we were able to decode as events
    map(message => decode(D.UnknownArray)(message).map(e => decodeOrNull(incomingThreadEventDecoder)(e)).filter(isNotNull)),
    catchError(() => EMPTY), // ignore undecoded messages
  );

  state$ = this.clearEvents$.pipe(
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

  constructor(
    private forumService: ForumService,
    private activityLogService: ActivityLogService,
  ) {}

  ngOnDestroy(): void {
    this.clearEvents$.complete();
    this.threadSub?.unsubscribe();
  }

  setThread(threadInfo: ThreadInfo): void {
    if (this.threadInfo) throw new Error('"leaveThread" should be called before setThread when changing thread');
    if (this.threadSub && !this.threadSub.closed) throw new Error('unexpected: threadSub has not been closed');
    this.threadInfo = threadInfo;
    // send 'subscribe' each time the ws is reopened
    this.threadSub = this.forumService.isWsOpen$.pipe(filter(open => open)).subscribe(() => {
      this.clearEvents$.next();
      this.send(SUBSCRIBE);
    });
  }

  leaveThread(): void {
    this.threadSub?.unsubscribe(); // stop sending subscribes on ws open
    // send 'unsubscribe' only if the ws is open
    if (this.threadInfo) this.forumService.isWsOpen$.pipe(take(1), filter(open => open)).subscribe(() => this.send(UNSUBSCRIBE));
    this.clearEvents$.next();
    this.threadInfo = undefined;
  }

  private send(action: ThreadAction): void {
    if (!this.threadInfo) throw new Error('service must be initialized');
    const token = {
      participantId: this.threadInfo.participant.id,
      itemId: this.threadInfo.itemRoute.id,
      userId: this.threadInfo.currentUserId,
      isMine: this.threadInfo.participant.id === this.threadInfo.currentUserId,
      canWatchParticipant: this.threadInfo.canWatchParticipant,
    };
    this.forumService.send({ ...action, token });
  }

  syncEvents(): Observable<void> {
    if (!this.threadInfo) throw new Error('cannot sync thread without token data');
    const { participant, currentUserId, itemRoute } = this.threadInfo;
    const watchedGroupId = participant.id === currentUserId ? undefined : participant.id;

    return this.activityLogService.getActivityLog(itemRoute.id, watchedGroupId).pipe(
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
      tap(events => {
        this.send(publishEventsAction(events));
      }),
      map(() => undefined)
    );
  }

  sendMessage(message: string): void {
    if (!message) throw new Error('Cannot send an empty message');
    this.send(publishEventsAction([ messageEvent(message) ]));
  }

}
