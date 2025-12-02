import { Component, Input, OnChanges } from '@angular/core';
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
import { isMessageEvent, ThreadEvent } from '../../models/thread-events';
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
  ],
})
export class ThreadMessageComponent implements OnChanges {
  @Input({ required: true }) threadId!: ThreadId;
  @Input({ required: true }) event!: ThreadEvent;
  @Input() userCache: UserInfo[] = [];
  @Input() canCurrentUserLoadAnswers = false;
  @Input() itemRoute?: RawItemRoute;
  userInfo?: UserInfo & { name: string };

  ngOnChanges(): void {
    const userId = isMessageEvent(this.event) ? this.event.authorId : this.threadId.participantId;
    const userInfo = this.userCache.find(user => user.id === userId);
    this.userInfo = userInfo ? { ...userInfo, name: userInfo.name ?? $localize`An unknown user` } : undefined;
  }

}
