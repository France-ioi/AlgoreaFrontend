import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { DiscussionService } from '../../../modules/item/services/discussion.service';
import { filter, map, Subscription } from 'rxjs';
import { isNotUndefined } from '../../../shared/helpers/null-undefined-predicates';
import { ThreadComponent } from '../thread/thread.component';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  visible$ = this.discussionService.state$.pipe(filter(isNotUndefined), map(({ visible }) => visible));

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
