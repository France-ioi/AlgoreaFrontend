import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { GetUserService } from 'src/app/groups/data-access/get-user.service';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { groupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { Answer } from '../../services/item-task.service';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe, DatePipe } from '@angular/common';
import { ScoreRingComponent } from '../../../ui-components/score-ring/score-ring.component';
import { ButtonModule } from 'primeng/button';
import { ItemRouteWithAnswerPipe, RawItemRoutePipe } from '../../../pipes/itemRoute';
import { ItemData } from '../../services/item-datasource.service';
import { RouteUrlPipe } from '../../../pipes/routeUrl';
import { UserSessionService } from '../../../services/user-session.service';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store';

@Component({
  selector: 'alg-answer-author-indicator[answer]',
  templateUrl: './answer-author-indicator.component.html',
  styleUrls: [ './answer-author-indicator.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    AsyncPipe,
    DatePipe,
    UserCaptionPipe,
    ScoreRingComponent,
    ButtonModule,
    RawItemRoutePipe,
    ItemRouteWithAnswerPipe,
    RouteUrlPipe,
    LetDirective,
  ],
})
export class AnswerAuthorIndicatorComponent implements OnChanges, OnDestroy {

  @Input() answer!: Answer;
  @Input() itemData?: ItemData;

  answer$ = new ReplaySubject<Answer>(1);
  readonly author$ = this.answer$.pipe(
    switchMap(answer => this.getUserService.getForId(answer.authorId)),
    mapToFetchState(),
    shareReplay(1),
  );
  readonly groupLink$ = this.author$.pipe(
    readyData(),
    map(user => this.groupRouter.urlArray(groupRoute({ id: user.groupId, isUser: true }, [])))
  );
  readonly currentUserId$ = this.userSessionService.userProfile$.pipe(
    map(userProfile => userProfile.groupId),
  );
  readonly isObserving$ = this.store.select(fromObservation.selectIsObserving);

  constructor(
    private store: Store,
    private groupRouter: GroupRouter,
    private getUserService: GetUserService,
    private userSessionService: UserSessionService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.answer) this.answer$.next(this.answer);
  }

  ngOnDestroy(): void {
    this.answer$.complete();
  }
}
