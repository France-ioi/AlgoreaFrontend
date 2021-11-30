import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { GetUserService } from 'src/app/modules/group/http-services/get-user.service';
import { mapToFetchState, readyData } from 'src/app/shared/operators/state';
import { groupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { Answer } from '../../http-services/get-answer.service';

@Component({
  selector: 'alg-answer-author-indicator[answer]',
  templateUrl: './answer-author-indicator.component.html',
  styleUrls: [ './answer-author-indicator.component.scss' ],
})
export class AnswerAuthorIndicatorComponent implements OnChanges {

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
}
