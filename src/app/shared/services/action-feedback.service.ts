import { Injectable } from '@angular/core';
import { Message, MessageService } from 'primeng/api';
import { animationFrames } from 'rxjs';
import { take } from 'rxjs/operators';
import { SECONDS } from '../helpers/duration';

const DISPLAY_DURATION = 5*SECONDS;
interface FeedbackOptions {
  life?: number,
  key?: string,
}
type Feedback = Message & { key: string };

@Injectable({
  providedIn: 'root'
})
export class ActionFeedbackService {
  readonly feedbacks: Feedback[] = [];

  constructor(
    private messageService: MessageService,
  ) {
    this.messageService.clearObserver.subscribe(cleared => {
      const index = this.feedbacks.findIndex(({ key }) => key === cleared);
      if (index > -1) this.feedbacks.splice(index, 1);
    });
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

  clear(key?: string): void {
    this.messageService.clear(key);
  }

  hasFeedback(key: string): boolean {
    return this.feedbacks.some(feedback => feedback.key === key);
  }

  private message(severity: 'success'|'info'|'warn'|'error', summary: string, detail: string, options?: FeedbackOptions): void {
    const key = options?.key ?? this.createKey();
    if (this.keyExists(key)) throw new Error(`key "${key}" already exists, pick another one`);
    const life = options?.life ?? DISPLAY_DURATION;
    const feedback = { severity, summary, detail, key, life };
    this.feedbacks.push(feedback);

    // Wait for app to render toast in the DOM
    animationFrames().pipe(take(1)).subscribe(() => {
      this.messageService.add(feedback);
    });
  }

  private keyExists(key: string): boolean {
    return this.feedbacks.some(feedback => feedback.key === key);
  }

  private createKey(): string {
    const key = `feedback-${Math.floor(Math.random() * 1000000)}`
    return this.keyExists(key) ? this.createKey() : key
  }

}
