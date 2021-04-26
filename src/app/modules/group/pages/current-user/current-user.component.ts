import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { CurrentUserHttpService, UserProfile } from '../../../../shared/http-services/current-user.service';
import { Observable } from 'rxjs';

const currentUserBreadcrumbCat = $localize`Yourself`;

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent implements OnInit, OnDestroy {
  currentUser$?: Observable<UserProfile>;

  constructor(
    private currentContent: CurrentContentService,
    private currentUserHttpService: CurrentUserHttpService
  ) {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: currentUserBreadcrumbCat, path: [], currentPageIdx: -1 } }));
  }

  ngOnInit(): void {
    this.currentUser$ = this.currentUserHttpService.getProfileInfo();
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

}
