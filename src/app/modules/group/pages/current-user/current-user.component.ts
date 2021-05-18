import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { CurrentUserHttpService } from 'src/app/shared/http-services/current-user.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { LocaleService } from '../../../../core/services/localeService';
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
    private currentUser: CurrentUserHttpService,
    private actionFeedbackService: ActionFeedbackService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: $localize`Yourself`, path: [], currentPageIdx: -1 } }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

  onChangeLang(event: string): void {
    this.update({ default_language: event });
  }

  update(changes: { default_language: string }): void {
    this.currentUser.update(changes).subscribe(
      () => {
        this.actionFeedbackService.success($localize`Changes successfully saved.`);

        if (changes.default_language) {
          this.localeService.navigateTo(changes.default_language);
        }

      }, _err => {
        this.actionFeedbackService.unexpectedError();
      }
    );
  }

}
