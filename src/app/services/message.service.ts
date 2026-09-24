import { BehaviorSubject, defer, mergeMap, NEVER, Observable, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { distinctUntilChanged, filter, finalize, map, pairwise, switchMap, take, takeUntil } from 'rxjs/operators';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { SECONDS } from 'src/app/utils/duration';

export interface MessageV2 {
  severity: 'success'|'info'|'warn'|'error',
  summary?: string,
  detail: string,
  life?: number,
  onClick?: () => void,
}

const DISPLAY_DURATION = 5*SECONDS;

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSubject = new BehaviorSubject<MessageV2[]>([]);
  private heldSubjects = new Map<MessageV2, BehaviorSubject<boolean>>();

  messages$ = this.messageSubject.asObservable();
  messageCloseEvent$ = this.messages$.pipe(
    pairwise(),
    map(([ prevMessages, messages ]) =>
      messages.find(m => !prevMessages.some(pm => pm === m)),
    ),
    filter(isNotUndefined),
    mergeMap(m => this.autoDismissWhenReady$(m)),
  );

  add(message: MessageV2): void {
    this.messageSubject.next([ message, ...this.messageSubject.value ]);
  }

  dismiss(message: MessageV2): void {
    this.messageSubject.next(this.messageSubject.value.filter(m => m !== message));
  }

  clear(): void {
    this.messageSubject.next([]);
  }

  /** Pause (`true`) or resume (`false`) auto-dismiss for an in-flight message. No-op if already gone. */
  setAutoDismissHeld(message: MessageV2, held: boolean): void {
    this.heldSubjects.get(message)?.next(held);
  }

  private autoDismissWhenReady$(message: MessageV2): Observable<MessageV2> {
    const held$ = new BehaviorSubject(false);
    this.heldSubjects.set(message, held$);
    const duration = message.life || DISPLAY_DURATION;

    return defer(() => {
      let remaining = duration;
      let segmentStartedAt = Date.now();

      return held$.pipe(
        distinctUntilChanged(),
        switchMap(held => {
          if (held) {
            remaining = Math.max(0, remaining - (Date.now() - segmentStartedAt));
            return NEVER;
          }
          segmentStartedAt = Date.now();
          return timer(remaining);
        }),
        take(1),
        map(() => message),
        takeUntil(this.messages$.pipe(filter(messages => !messages.includes(message)))),
        finalize(() => {
          this.heldSubjects.delete(message);
          held$.complete();
        }),
      );
    });
  }
}
