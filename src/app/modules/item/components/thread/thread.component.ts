import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ThreadService } from '../../services/threads.service';
import { FormBuilder } from '@angular/forms';
import { readyData } from '../../../../shared/operators/state';
import { Subscription, filter, delay } from 'rxjs';
import { DiscussionService } from '../../services/discussion.service';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { withLatestFrom } from 'rxjs/operators';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('sendMessageForm') sendMessageForm?: ElementRef<HTMLFormElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  state$ = this.threadService.state$;

  private subscription?: Subscription;

  constructor(
    private threadService: ThreadService,
    private discussionService: DiscussionService,
    private fb: FormBuilder,
  ) {}

  ngAfterViewInit(): void {
    this.subscription = this.state$.pipe(
      readyData(),
      withLatestFrom(this.discussionService.state$.pipe(filter(isNotUndefined))),
      filter(([ events , { visible }]) => visible && events.length > 0 && (events[events.length - 1]?.label === 'submission'
        || !!(this.messagesScroll && this.sendMessageForm && (this.messagesScroll.nativeElement.scrollHeight
          <= (this.messagesScroll.nativeElement.scrollTop + this.messagesScroll.nativeElement.offsetHeight
            + this.sendMessageForm.nativeElement.offsetHeight + parseInt(getComputedStyle(this.messagesScroll.nativeElement).paddingBottom)))))
      ),
      delay(0),
    ).subscribe(() => this.scrollDown());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  sendMessage(): void {
    const messageToSend = this.form.value.messageToSend;
    if (!messageToSend || !messageToSend.trim()) return;
    this.threadService.sendMessage(messageToSend);
    this.form.reset({
      messageToSend: '',
    });
  }

  scrollDown(): void {
    if (!this.messagesScroll) return;

    this.messagesScroll.nativeElement.scrollTo(
      0,
      this.messagesScroll.nativeElement.scrollHeight - this.messagesScroll.nativeElement.offsetHeight
    );
  }

}
