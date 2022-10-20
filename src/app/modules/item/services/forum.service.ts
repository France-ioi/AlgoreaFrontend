import { Injectable, OnDestroy } from '@angular/core';
import { appConfig } from 'src/app/shared/helpers/config';
import { map, merge, retry, shareReplay, startWith, Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { SECONDS } from 'src/app/shared/helpers/duration';

const wsRetryDelay = 5*SECONDS;

@Injectable({
  providedIn: 'root',
})
export class ForumService implements OnDestroy {

  private openEvents$ = new Subject<Event>();
  private closeEvents$ = new Subject<CloseEvent>();
  private ws$ = webSocket<unknown>({ url: appConfig.forumServerUrl!, openObserver: this.openEvents$, closeObserver: this.closeEvents$ });

  isWsOpen$ = merge(
    this.openEvents$.pipe(map(() => true)),
    this.closeEvents$.pipe(map(() => false)),
  ).pipe(
    startWith(false),
    shareReplay(1)
  );

  inputMessages$ = this.ws$.pipe(retry({ delay: wsRetryDelay }));

  // subscribe to the ws so that it stays open until 'destroy'
  private subscription = this.inputMessages$.subscribe();

  constructor() {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.ws$.complete();
    this.openEvents$.complete();
    this.closeEvents$.complete();
  }

  send(msg: unknown): void {
    // the websocket will queue the messages while the connection is not established
    this.ws$.next(msg);
  }

}
