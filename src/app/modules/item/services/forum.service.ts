import { Injectable, OnDestroy } from '@angular/core';
import { appConfig } from 'src/app/shared/helpers/config';
import { combineLatest, filter, map, merge, noop, of, shareReplay, Subject, switchMap, take } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

export enum WsStatus { Closed, Opened, Initializing }

@Injectable({
  providedIn: 'root',
})
export class ForumService implements OnDestroy {

  private openEvents$ = new Subject<Event>();
  private closeEvents$ = new Subject<CloseEvent>();
  private ws$ = merge(of(noop), this.closeEvents$).pipe(
    map(() => {
      if (!appConfig.forumServerUrl) throw new Error('cannot instantiate forum service without forum server url');
      return webSocket<unknown>({ url: appConfig.forumServerUrl, openObserver: this.openEvents$, closeObserver: this.closeEvents$ });
    }),
    shareReplay(1)
  );
  wsStatus$ = merge(
    this.ws$.pipe(map(() => WsStatus.Initializing)),
    this.openEvents$.pipe(map(() => WsStatus.Opened)),
    this.closeEvents$.pipe(map(() => WsStatus.Closed)),
  ).pipe(shareReplay(1));

  inputMessages$ = this.ws$.pipe(switchMap(ws => ws));

  constructor() {}

  ngOnDestroy(): void {
    this.openEvents$.complete();
    this.closeEvents$.complete();
  }

  send(msg: unknown): void {
    combineLatest([ this.wsStatus$, this.ws$ ]).pipe(
      take(1),
      filter(([ wsStatus ]) => wsStatus === WsStatus.Opened),
      map(([ _st, ws ]) => ws),
    ).subscribe(ws => ws.next(msg));
  }

}
