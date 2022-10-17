import { Injectable, OnDestroy } from '@angular/core';
import { appConfig } from 'src/app/shared/helpers/config';
import { Observable, retry, Subject, SubscriptionLike } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';

@Injectable({
  providedIn: 'root',
})
export class ForumService implements OnDestroy {

  private ws: WebSocketSubject<unknown>;
  private receiver$: Observable<unknown>;
  private errorSub: SubscriptionLike;
  error$ = new Subject<unknown>();

  constructor(
    private actionFeedbackService: ActionFeedbackService,
  ) {
    if (!appConfig.forumServerUrl) throw new Error('cannot instantiate forum service without forum server url');
    this.ws = webSocket(appConfig.forumServerUrl);
    this.receiver$ = this.ws.pipe(
      retry({ resetOnSuccess: true, count: 1 })
    );
    this.errorSub = this.receiver$.subscribe({
      error: err => {
        this.actionFeedbackService.error('Connection error to the forum service: you will need to refresh the page to use forum');
        this.error$.next(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.errorSub.unsubscribe();
    this.error$.complete();
    this.ws.complete();
  }

  multiplex(_subMsg: () => unknown, _unsubMsg: () => unknown, _messageFilter: (value: unknown) => boolean): Observable<unknown> {
    return this.receiver$;
  }

  send(msg: unknown): void {
    this.ws.next(msg);
  }

}
