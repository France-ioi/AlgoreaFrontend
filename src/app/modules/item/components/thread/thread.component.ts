import { Component } from '@angular/core';
import { ThreadService } from '../../services/threads.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent {
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

}
