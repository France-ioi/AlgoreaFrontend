import { Injectable, OnDestroy } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { decode, decodeOrNull } from 'src/app/shared/helpers/decoders';
import {
  catchError,
  combineLatest,
  concat,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  fromEvent,
  map,
  Observable,
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
import { publishEventsAction, subscribeAction, ThreadToken, unsubscribeAction } from './threads-outbound-actions';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { messageEvent } from './threads-events';
import { IncomingThreadEvent, incomingThreadEventDecoder } from './threads-inbound-events';
import { allowsWatchingResults, ItemPermWithWatch } from 'src/app/shared/models/domain/item-watch-permission';
import { RawItemRoute } from 'src/app/shared/routing/item-route';
import { isItemInfo } from 'src/app/shared/models/content/item-info';
import { isATask } from 'src/app/shared/helpers/item-type';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { formatUser } from 'src/app/shared/helpers/user';

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

function threadInfoToToken(t: ThreadInfo): ThreadToken {
  return {
    participantId: t.participant.id,
    itemId: t.itemRoute.id,
    userId: t.currentUserId,
    isMine: t.participant.id === t.currentUserId,
    canWatchParticipant: t.canWatchParticipant,
  };
}

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {

  private clearEvents$ = new ReplaySubject<void>(1);

  threadInfo$ = combineLatest([
    this.userSessionService.userProfile$,
    this.currentContentService.content$,
    this.groupWatchingService.watchedGroup$,
    fromEvent(window, 'beforeunload').pipe(map(() => true), startWith(false)),
  ]).pipe(
    debounceTime(0), // as the source are not independant, prevent some very-transient inconsistent cases
    map(([ session, content, watching, unloading ]) => {
      // window is unloading -> no thread anymore
      if (unloading) return undefined;
      // only tasks
      if (!isItemInfo(content) || !content.details || !isATask(content.details)) return undefined;
      // only non temp users
      if (session.tempUser) return undefined;
      // if watching, only for users (not group) and for content we can watch
      if (watching && (!watching.route.isUser || !allowsWatchingResults(content.details.permissions))) return undefined;
      return {
        participant: {
          id: watching ? watching.route.id : session.groupId,
          name: watching ? watching.name : formatUser(session),
        },
        currentUserId: session.groupId,
        itemRoute: content.route,
        canWatchParticipant: !!watching,
        contentWatchPermission: content.details.permissions,
      };
    }),
    startWith(undefined),
    distinctUntilChanged((x, y) => x?.participant.id === y?.participant.id && x?.itemRoute.id === y?.itemRoute.id),
    shareReplay(1),
  );
  private threadSubscriptionSub = this.threadInfo$.pipe(
    map(t => (t ? threadInfoToToken(t) : undefined)),
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
    private userSessionService: UserSessionService,
    private currentContentService: CurrentContentService,
    private groupWatchingService: GroupWatchingService,
  ) {}

  ngOnDestroy(): void {
    this.clearEvents$.complete();
    this.threadSubscriptionSub.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  syncEvents(): Observable<void> {
    return this.threadInfo$.pipe(
      take(1),
      filter(isNotUndefined),
      map(t => ({
        itemId: t.itemRoute.id,
        watchedGroupId: t.participant.id === t.currentUserId ? undefined : t.participant.id,
        token: threadInfoToToken(t),
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
        map(threadInfoToToken),
      ).subscribe(token => this.forumService.send(publishEventsAction(token, [ messageEvent(message) ])))
    );
  }

}
