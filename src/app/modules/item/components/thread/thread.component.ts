import { Component } from '@angular/core';
import { filter, map } from 'rxjs';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { DiscussionService } from '../../services/discussion.service';
import { ThreadService } from '../../services/threads.service';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent {
  messageToSend = '';

  state$ = this.threadService.state$;

  visible$ = this.discussionService.state$.pipe(filter(isNotUndefined), map(({ visible }) => visible));

  constructor(
    private threadService: ThreadService,
    private discussionService: DiscussionService,
  ) {}

  sendMessage(): void {
    const messageToSend = this.messageToSend.trim();
    if (!messageToSend) return;
    this.threadService.sendMessage(messageToSend);
    this.messageToSend = '';
  }

}
