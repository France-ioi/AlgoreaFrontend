import { Injectable, OnDestroy } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';
import { MessageV2 } from 'src/app/services/message.service';

type FeedbackOptions = Omit<MessageV2, 'summary' | 'detail' | 'severity'>;

@Injectable({
  providedIn: 'root'
})
export class ActionFeedbackService implements OnDestroy {
  hasFeedback = false;

  private subscription = this.messageService.messages$.subscribe(messages =>
    (this.hasFeedback = messages.length > 0)
  );

  constructor(
    private messageService: MessageService,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
    this.messageService.add({ severity, summary, detail, ...options });
  }

}
