import { Component, computed, input } from '@angular/core';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { UserInfo } from './thread-user-info';
import { AllowDisplayCodeSnippet } from '../../../pipes/allowDisplayCodeSnippet';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from '../../../ui-components/score-ring/score-ring.component';
import { NgClass, NgTemplateOutlet, DatePipe } from '@angular/common';
import { BreakLinesPipe } from '../../../pipes/breakLines';
import { ThreadId } from '../../models/threads';
import {
  IsAttemptStartedEventPipe,
  isMessageEvent,
  IsMessageEventPipe,
  IsSubmissionEventPipe,
  ThreadEvent
} from '../../models/thread-events';
import { RelativeTimePipe } from '../../../pipes/relativeTime';

@Component({
  selector: 'alg-thread-message',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    ScoreRingComponent,
    RouterLink,
    DatePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    AllowDisplayCodeSnippet,
    BreakLinesPipe,
    RelativeTimePipe,
    IsMessageEventPipe,
    IsAttemptStartedEventPipe,
    IsSubmissionEventPipe,
  ],
})
export class ThreadMessageComponent {
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

}

