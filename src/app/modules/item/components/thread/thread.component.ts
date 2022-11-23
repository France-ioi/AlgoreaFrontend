import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ThreadService } from '../../services/threads.service';
import { FormBuilder } from '@angular/forms';
import { readyData } from '../../../../shared/operators/state';
import { Subscription, combineLatest } from 'rxjs';
import { UserSessionService } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-thread',
  templateUrl: './thread.component.html',
  styleUrls: [ './thread.component.scss' ],
})
export class ThreadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLDivElement>;

  form = this.fb.nonNullable.group({
    messageToSend: [ '' ],
  });

  state$ = this.threadService.state$;

  private subscription?: Subscription;

  constructor(
    private threadService: ThreadService,
    private fb: FormBuilder,
    private userSessionService: UserSessionService,
  ) {}

  ngAfterViewInit(): void {
    this.subscription = combineLatest([
      this.state$.pipe(readyData()),
      this.userSessionService.userProfile$,
    ]).subscribe(([ events, currentUser ]) => {
      const lastEvent = events[events.length - 1];
      if (lastEvent && lastEvent.createdBy === currentUser.groupId) {
        setTimeout(() => {
          this.scrollDown();
        });
      }
    });
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
    if (!this.messagesScroll) {
      throw new Error('Unexpected: Missed scroll el');
    }

    this.messagesScroll.nativeElement.scrollTo(
      0,
      this.messagesScroll.nativeElement.scrollHeight - this.messagesScroll.nativeElement.offsetHeight
    );
  }

}
