import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SECONDS } from '../helpers/duration';

const DISPLAY_DURATION = 5*SECONDS;
interface FeedbackOptions {
  life?: number,
}

@Injectable({
  providedIn: 'root'
})
export class ActionFeedbackService {

  constructor(
    private messageService: MessageService,
  ) {}

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

  hide(): void {
    this.messageService.clear();
  }

  private message(severity: 'success'|'info'|'warn'|'error', summary: string, detail: string, options?: FeedbackOptions): void {
    this.messageService.add({ severity: severity, summary: summary, detail: detail, life: DISPLAY_DURATION, ...options });
  }

}
