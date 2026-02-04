import { BehaviorSubject, mergeMap, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { filter, map, pairwise } from 'rxjs/operators';
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
  messages$ = this.messageSubject.asObservable();
  messageCloseEvent$ = this.messages$.pipe(
    pairwise(),
    map(([ prevMessages, messages ]) =>
      messages.find(m => !prevMessages.some(pm => pm === m)),
    ),
    filter(isNotUndefined),
    mergeMap(m => timer(m.life || DISPLAY_DURATION).pipe(map(() => m))),
  );

  constructor() {}

  add(message: MessageV2): void {
    this.messageSubject.next([ message, ...this.messageSubject.value ]);
  }

  dismiss(message: MessageV2): void {
    this.messageSubject.next(this.messageSubject.value.filter(m => m !== message));
  }

  clear(): void {
    this.messageSubject.next([]);
  }
}
