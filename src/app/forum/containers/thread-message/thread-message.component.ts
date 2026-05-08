import { Component, computed, inject, input } from '@angular/core';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { UserInfo } from './thread-user-info';
import { AllowDisplayCodeSnippet } from '../../../pipes/allowDisplayCodeSnippet';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { Router, RouterLink } from '@angular/router';
import { ScoreRingComponent } from '../../../ui-components/score-ring/score-ring.component';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { BreakLinesPipe } from '../../../pipes/breakLines';
import { ThreadId } from '../../models/threads';
import {
  IsAttemptStartedEventPipe,
  isMessageEvent,
  IsMessageEventPipe,
  IsSubmissionEventPipe,
  ThreadEvent
} from '../../models/thread-events';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';

@Component({
  selector: 'alg-thread-message',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
  imports: [
    NgClass,
    NgTemplateOutlet,
    ScoreRingComponent,
    RouterLink,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    AllowDisplayCodeSnippet,
    BreakLinesPipe,
    RelativeTimeComponent,
    IsMessageEventPipe,
    IsAttemptStartedEventPipe,
    IsSubmissionEventPipe,
  ],
})
export class ThreadMessageComponent {
  private store = inject(Store);
  private router = inject(Router);
  private activeContentPage = this.store.selectSignal(fromItemContent.selectActiveContentPage);

  threadId = input.required<ThreadId>();
  event = input.required<ThreadEvent>();
  userCache = input<UserInfo[]>([]);
  canCurrentUserLoadAnswers = input<boolean>(false);
  itemRoute = input<RawItemRoute>();

  userInfo = computed<UserInfo>(() => {
    const event = this.event();
    const id = isMessageEvent(event) ? event.authorId : this.threadId().participantId;
    const userInfo = this.userCache().find(user => user.id === id);
    return userInfo ?? { id, isCurrentUser: false, isThreadParticipant: this.threadId().participantId === id };
  });

  onNavigateToSolution(): void {
    const previousPage = this.activeContentPage();
    let backLabel: string;
    switch (previousPage?.[0]) {
      case 'forum':
        backLabel = $localize`Back to the forum tab`;
        break;
      default:
        backLabel = $localize`Back to the previous content`;
    }
    this.store.dispatch(fromItemContent.sourcePageActions.registerBackLink({
      backLink: {
        url: this.router.url,
        label: backLabel,
      },
    }));
  }
}

