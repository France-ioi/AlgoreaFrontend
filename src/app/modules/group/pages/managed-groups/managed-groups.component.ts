import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentContentService } from '../../../../shared/services/current-content.service';

@Component({
  selector: 'alg-managed-groups',
  templateUrl: './managed-groups.component.html',
  styleUrls: [ './managed-groups.component.scss' ]
})
export class ManagedGroupsComponent implements OnInit, OnDestroy {

  title = 'Groups you manage';

  constructor(
    private currentContent: CurrentContentService,
  ) {}

  ngOnInit(): void {
    this.currentContent.current.next({
      type: 'group',
      breadcrumbs: {
        category: this.title,
        path: [],
        currentPageIdx: -1,
      },
      title: this.title,
    });
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }
}
