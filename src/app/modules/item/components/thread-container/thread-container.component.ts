import { Component, Input } from '@angular/core';
import { animate, style, transition, state, trigger } from '@angular/animations';
import { DiscussionService } from '../../services/discussion.service';
import { filter, map } from 'rxjs';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';

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
export class ThreadContainerComponent {
  @Input() topCompensation = 0;

  visible$ = this.discussionService.state$.pipe(filter(isNotUndefined), map(({ visible }) => visible));

  constructor(private discussionService: DiscussionService) {
  }
}
