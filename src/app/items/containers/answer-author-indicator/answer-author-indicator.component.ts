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
  ],
})
export class AnswerAuthorIndicatorComponent implements OnChanges, OnDestroy {

  @Input() answer!: Answer;

  private answer$ = new ReplaySubject<Answer>(1);
  readonly author$ = this.answer$.pipe(
    switchMap(answer => this.getUserService.getForId(answer.authorId)),
    mapToFetchState(),
    shareReplay(1),
  );
  readonly groupLink$ = this.author$.pipe(
    readyData(),
    map(user => this.groupRouter.urlArray(groupRoute({ id: user.groupId, isUser: true }, [])))
  );

  constructor(
    private groupRouter: GroupRouter,
    private getUserService: GetUserService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.answer) this.answer$.next(this.answer);
  }

  ngOnDestroy(): void {
    this.answer$.complete();
  }
}
