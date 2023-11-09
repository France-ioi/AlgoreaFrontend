import { Component, Input, OnChanges } from '@angular/core';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { IncomingThreadEvent } from '../../data-access/websocket-messages/threads-inbound-events';
import { UserInfo } from './thread-user-info';
import { AllowDisplayCodeSnippet } from '../../../pipes/allowDisplayCodeSnippet';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithAnswerPipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from '../../../ui-components/score-ring/score-ring.component';
import { NgClass, NgIf, NgTemplateOutlet, DatePipe } from '@angular/common';
import { BreakLinesPipe } from '../../../pipes/breakLines';
import { ThreadId } from '../../models/threads';
import { isAttemptStartedEvent, isSubmissionEvent } from '../../models/thread-events';

@Component({
  selector: 'alg-thread-message',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgTemplateOutlet,
    ScoreRingComponent,
    RouterLink,
    DatePipe,
    ItemRouteWithAnswerPipe,
    RouteUrlPipe,
    AllowDisplayCodeSnippet,
    BreakLinesPipe,
  ],
})
export class ThreadMessageComponent implements OnChanges {
  @Input({ required: true }) threadId!: ThreadId;
  @Input({ required: true }) event!: IncomingThreadEvent;
  @Input() userCache: UserInfo[] = [];
  @Input() canCurrentUserLoadAnswers = false;
  @Input() itemRoute?: RawItemRoute;
  userInfo?: UserInfo & { name: string };

  ngOnChanges(): void {
    const isAttemptOrSubmissionEvent = isAttemptStartedEvent(this.event) || isSubmissionEvent(this.event);
    const userId = isAttemptOrSubmissionEvent ? this.threadId.participantId : this.event.createdBy;
    const userInfo = this.userCache.find(user => user.id === userId);
    this.userInfo = userInfo ? { ...userInfo, name: userInfo.name ?? $localize`An unknown user` } : undefined;
  }

}
