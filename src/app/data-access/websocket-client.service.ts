import { Injectable, OnDestroy, inject } from '@angular/core';
import { EMPTY, map, merge, retry, shareReplay, startWith, Subject, switchMap, timer } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { MINUTES, SECONDS } from 'src/app/utils/duration';
import { APPCONFIG } from '../config';

const wsRetryDelay = 5*SECONDS;
const heartbeatStartDelay = 1*MINUTES;
const heartbeatStartPeriod = 4*MINUTES; // API gatetway closes the connection after 10min without activity

@Injectable({
  providedIn: 'root'
})
export class WebsocketClient implements OnDestroy {

  private config = inject(APPCONFIG);

  private openEvents$ = new Subject<Event>();
  private closeEvents$ = new Subject<CloseEvent>();
  private wsUrl = this.config.slsWsUrl;
  private ws$ = this.wsUrl ?
    webSocket<unknown>({ url: this.wsUrl, openObserver: this.openEvents$, closeObserver: this.closeEvents$ }) :
    undefined;

  isWsOpen$ = merge(
    this.openEvents$.pipe(map(() => true)),
    this.closeEvents$.pipe(map(() => false)),
  ).pipe(
    startWith(false),
    shareReplay(1)
  );

  inputMessages$ = this.ws$ ? this.ws$.pipe(retry({ delay: wsRetryDelay })) : EMPTY;

  private heartbeatSubscription = this.isWsOpen$.pipe(
    switchMap(open => {
      if (!open) return EMPTY;
      return timer(heartbeatStartDelay, heartbeatStartPeriod);
    })
  ).subscribe(() => this.send({ action: 'heartbeat' })); // the action is not necessarily recognized, it is used to keep the connection up

  ngOnDestroy(): void {
    this.heartbeatSubscription.unsubscribe();
    this.ws$?.complete();
    this.openEvents$.complete();
    this.closeEvents$.complete();
  }

  send(msg: unknown): void {
    if (!this.ws$) throw new Error('Unexpected: sending message while websocket is not initialized');
    // the websocket will queue the messages while the connection is not established
    this.ws$.next(msg);
  }

}
