import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { environment } from 'src/environments/environment';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { catchError, EMPTY, Observable, scan } from 'rxjs';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

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
  connectionId: D.string,
});
export type FollowEvent = D.TypeOf<typeof followEventDecoder>;

const threadEventInputDecoder = D.union(
  threadOpenedEventDecoder,
  threadClosedEventDecoder,
  followEventDecoder,
);

const threadEventDecoder = pipe(
  D.struct({ time: dateDecoder }),
  D.intersect(threadEventInputDecoder),
);
export type ThreadEvent = D.TypeOf<typeof threadEventDecoder>;

interface TokenData {
  participantId: string,
  itemId: string,
  userId: string,
  isMine: boolean,
  canWatchParticipant: boolean,
}

type Action = 'open-thread' | 'close-thread' | 'follow';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {

  private tokenData?: TokenData;
  private socket: WebSocketSubject<unknown>;
  messages$: Observable<ThreadEvent[]>;

  constructor() {
    if (!environment.forumServerUrl) throw new Error('cannot instantiate threads service when no forum server url');
    this.socket = webSocket(environment.forumServerUrl);
    this.messages$ = this.socket.pipe(
      decodeSnakeCase(D.array(threadEventDecoder)),
      scan((oldEvents, newEvents) => [ ...oldEvents, ...newEvents ]),
      catchError(() => EMPTY), // ignore undecoded messages
    );
    this.socket.subscribe({
      error: e => console.error('thread error', e)
    });
  }

  init(tokenData: TokenData): void {
    this.tokenData = tokenData;
  }

  send(action: Action): void {
    if (!this.tokenData) throw new Error('service must be initialized');
    this.socket.next({
      token: this.tokenData,
      action,
    });
  }

}
