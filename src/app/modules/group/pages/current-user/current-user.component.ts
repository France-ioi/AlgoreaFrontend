import { Component, OnDestroy } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

const currentUserBreadcrumbCat = $localize`Yourself`;

@Component({
  selector: 'alg-current-user',
  templateUrl: './current-user.component.html',
  styleUrls: [ './current-user.component.scss' ],
})
export class CurrentUserComponent implements OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: currentUserBreadcrumbCat, path: [], currentPageIdx: -1 } }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

}
