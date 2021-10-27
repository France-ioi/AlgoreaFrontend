import { Injectable, OnDestroy } from '@angular/core';
import { Message, MessageService } from 'primeng/api';
import { SECONDS } from '../helpers/duration';

const DISPLAY_DURATION = 5*SECONDS;
type FeedbackOptions = Omit<Message, 'key' | 'detail' | 'severity'>;

@Injectable({
  providedIn: 'root'
})
export class ActionFeedbackService implements OnDestroy {
  hasFeedback = false;

  private subscriptions = [
    this.messageService.clearObserver.subscribe(() => (this.hasFeedback = false)),
    this.messageService.messageObserver.subscribe(() => (this.hasFeedback = true)),
  ];

  constructor(
    private messageService: MessageService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  error(txt: string, options?: FeedbackOptions): void {
    this.message('error', $localize`Error`, txt, options);
  }

  unexpectedError(options?: FeedbackOptions): void {
    this.error($localize`The action cannot be executed. If the problem persists, contact us.`, options);
  }

  partial(txt: string, options?: FeedbackOptions): void {
    this.message('warn', $localize`Partial success`, txt, options);
  }

  success(txt: string, options?: FeedbackOptions): void {
    this.message('success', $localize`Success`, txt, options);
  }

  clear(): void {
    this.messageService.clear();
  }

  private message(severity: 'success'|'info'|'warn'|'error', summary: string, detail: string, options?: FeedbackOptions): void {
    this.messageService.add({ severity, summary, detail, life: DISPLAY_DURATION, ...options });
  }

}
