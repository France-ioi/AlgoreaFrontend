import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { animate, style, transition, state, trigger } from '@angular/animations';
import { DiscussionService } from '../../services/discussion.service';
import { filter, map, Subscription } from 'rxjs';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { ThreadComponent } from '../thread/thread.component';

const animationTiming = '.6s .2s ease-in-out';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
  animations: [
    trigger('openClose', [
      state('opened', style({
        right: 0,
      })),
      state('closed', style({
        right: '-25rem',
      })),
      transition('opened => closed', [
        animate(animationTiming)
      ]),
      transition('closed => opened', [
        animate(animationTiming)
      ]),
    ]),
  ]
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

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
}
