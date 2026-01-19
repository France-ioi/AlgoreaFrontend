import { Injectable, OnDestroy, inject } from '@angular/core';
import { EMPTY, map, merge, retry, shareReplay, startWith, Subject, switchMap, tap, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { MINUTES, SECONDS } from 'src/app/utils/duration';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';

const wsRetryDelay = 5*SECONDS;
const heartbeatStartDelay = 1*MINUTES;
const heartbeatStartPeriod = 4*MINUTES; // API gatetway closes the connection after 10min without activity

@Injectable({
  providedIn: 'root'
})
export class WebsocketClient implements OnDestroy {

  private config = inject(APPCONFIG);
  private identityTokenService = inject(IdentityTokenService);

  private openEvents$ = new Subject<Event>();
  private closeEvents$ = new Subject<CloseEvent>();
  private wsUrl = this.config.slsWsUrl;

  // Track current ws for send() method
  private currentWs: WebSocketSubject<unknown> | null = null;

  isWsOpen$ = merge(
    this.openEvents$.pipe(map(() => true)),
    this.closeEvents$.pipe(map(() => false)),
  ).pipe(
    startWith(false),
    shareReplay(1)
  );

  /**
   * Messages from the websocket.
   * - Creates websocket lazily on first subscription
   * - Recreates when user identity (token) changes
   * - On close/error, retries with a fresh token (if expired)
   */
  inputMessages$ = this.wsUrl ? this.identityTokenService.identityToken$.pipe(
    tap(() => this.currentWs?.complete()),
    map(token => {
      const url = new URL(this.wsUrl!);
      url.searchParams.set('token', token);
      return webSocket<unknown>({
        url: url.toString(),
        openObserver: this.openEvents$,
        closeObserver: this.closeEvents$
      });
    }),
    tap(ws => this.currentWs = ws),
    switchMap(ws => ws),
    // Retry re-subscribes to identityToken$, which checks expiry via defer
    retry({ delay: wsRetryDelay }),
    shareReplay(1),
  ) : EMPTY;

  private heartbeatSubscription = this.isWsOpen$.pipe(
    switchMap(open => {
      if (!open) return EMPTY;
      return timer(heartbeatStartDelay, heartbeatStartPeriod);
    })
  ).subscribe(() => this.send({ action: 'heartbeat' })); // the action is not necessarily recognized, it is used to keep the connection up

  ngOnDestroy(): void {
    this.heartbeatSubscription.unsubscribe();
    this.currentWs?.complete();
    this.openEvents$.complete();
    this.closeEvents$.complete();
  }

  send(msg: unknown): void {
    if (!this.currentWs) throw new Error('Unexpected: sending message while websocket is not initialized');
    // the websocket will queue the messages while the connection is not established
    this.currentWs.next(msg);
  }

}
