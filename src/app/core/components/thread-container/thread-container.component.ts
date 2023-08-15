import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { DiscussionService } from 'src/app/modules/item/services/discussion.service';
import { filter, Subscription } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.discussionService.visible$;

  private subscription?: Subscription;

  constructor(private discussionService: DiscussionService) {
  }

  ngAfterViewInit(): void {
    this.subscription = this.visible$.pipe(filter(visible => visible)).subscribe(() => {
      this.threadComponent?.scrollDown();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(): void {
    this.discussionService.toggleVisibility(false);
  }
}
