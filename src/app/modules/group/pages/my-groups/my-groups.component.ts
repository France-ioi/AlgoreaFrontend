import { Component, OnDestroy } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ]
})
export class MyGroupsComponent implements OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.current.next(contentInfo({ breadcrumbs: { category: $localize`My groups`, path: [], currentPageIdx: -1 } }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

}
