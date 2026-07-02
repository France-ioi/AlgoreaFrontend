import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RawItemRoute } from 'src/app/models/routing/item-route';
import { UserInfo } from './thread-user-info';
import { AllowDisplayCodeSnippet } from '../../../pipes/allowDisplayCodeSnippet';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { Router, RouterLink } from '@angular/router';
import { ScoreRingComponent } from '../../../ui-components/score-ring/score-ring.component';
import { NgTemplateOutlet } from '@angular/common';
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
import { UserResolutionCacheService } from 'src/app/groups/data-access/user-resolution-cache.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { formatUser } from 'src/app/groups/models/user';

@Component({
  selector: 'alg-thread-message',
  templateUrl: './thread-message.component.html',
  styleUrl: './thread-message.component.scss',
  imports: [
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
  private userCache = inject(UserResolutionCacheService);
  private userSession = inject(UserSessionService);
  private currentUserGroupId = toSignal(this.userSession.userProfile$.pipe(map(p => p.groupId)), { initialValue: undefined });

  threadId = input.required<ThreadId>();
  event = input.required<ThreadEvent>();
  canCurrentUserLoadAnswers = input<boolean>(false);
  itemRoute = input<RawItemRoute>();

  private subjectId = computed(() => {
    const event = this.event();
    return isMessageEvent(event) ? event.authorId : this.threadId().participantId;
  });

  private resolvedName = toSignal(
    toObservable(this.subjectId).pipe(
      switchMap(id => {
        const currentId = this.currentUserGroupId();
        if (id === currentId) return of(undefined);
        return this.userCache.resolveUser(id).pipe(map(u => (u ? formatUser(u) : undefined)));
      }),
    ),
    { initialValue: undefined },
  );

  userInfo = computed<UserInfo>(() => {
    const id = this.subjectId();
    return {
      id,
      isCurrentUser: id === this.currentUserGroupId(),
      isThreadParticipant: id === this.threadId().participantId,
      name: this.resolvedName(),
    };
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
