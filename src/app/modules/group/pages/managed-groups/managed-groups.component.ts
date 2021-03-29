import { Component, OnDestroy, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';

@Component({
  selector: 'alg-managed-groups',
  templateUrl: './managed-groups.component.html',
  styleUrls: [ './managed-groups.component.scss' ]
})
export class ManagedGroupsComponent implements OnInit, OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit(): void {
    this.currentContent.current.next(contentInfo({
      breadcrumbs: {
        category: $localize`Groups you manage`,
        path: [],
        currentPageIdx: -1,
      },
      title: $localize`Groups you manage`,
    }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }
}
