import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

const CurrentUserBreadcrumbCat = 'Yourself';

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent implements OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.current.next({
      type: 'group', breadcrumbs: { category: CurrentUserBreadcrumbCat, path: [], currentPageIdx: -1 }
    });

  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

}
