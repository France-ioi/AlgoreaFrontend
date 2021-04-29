import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SECONDS } from '../helpers/duration';

const DISPLAY_DURATION = 5*SECONDS;

@Injectable({
  providedIn: 'root'
})
export class ActionFeedbackService {

  constructor(
    private messageService: MessageService,
  ) {}

  error(txt: string): void {
    this.message('error', $localize`Error`, txt);
  }

  unexpectedError(): void {
    this.error($localize`The action cannot be executed. If the problem persists, contact us.`);
  }

  partial(txt: string): void {
    this.message('warn', $localize`Partial success`, txt);
  }

  success(txt: string): void {
    this.message('success', $localize`Success`, txt);
  }

  private message(severity: 'success'|'info'|'warn'|'error', summary: string, detail: string): void {
    this.messageService.add({ severity: severity, summary: summary, detail: detail, life: DISPLAY_DURATION });
  }

}
