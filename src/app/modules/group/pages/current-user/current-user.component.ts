import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent implements OnInit, OnDestroy {
  currentUser$ = this.userSessionService.user$;

  constructor(
    private currentContent: CurrentContentService,
    private userSessionService: UserSessionService,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  ngOnInit(): void {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: $localize`Yourself`, path: [], currentPageIdx: -1 } }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

  onLanguageChanged(): void {
    this.actionFeedbackService.success($localize`Changes successfully saved.`);
  }

  onLanguageChangeError(): void {
    this.actionFeedbackService.unexpectedError();
  }

}
