import { Component, ElementRef, ViewChild } from '@angular/core';
import { ThreadService } from '../../services/threads.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  state$ = this.threadService.state$;

  constructor(
    private threadService: ThreadService,
    private fb: FormBuilder,
  ) {}

  sendMessage(): void {
    const messageToSend = this.form.value.messageToSend;
    if (!messageToSend || !messageToSend.trim()) return;
    this.threadService.sendMessage(messageToSend);
    this.form.reset({
      messageToSend: '',
    });
  }

  scrollDown(): void {
    if (!this.messagesScroll) {
      throw new Error('Unexpected: Missed scroll el');
    }

    this.messagesScroll.nativeElement.scrollTo(
      0,
      this.messagesScroll.nativeElement.scrollHeight - this.messagesScroll.nativeElement.offsetHeight
    );
  }

}
