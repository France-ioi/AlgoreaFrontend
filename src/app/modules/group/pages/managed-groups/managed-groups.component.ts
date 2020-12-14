import { Component, OnDestroy, OnInit } from '@angular/core';
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
    this.currentContent.current.next({
      type: 'group',
      breadcrumbs: {
        category: 'Groups you manage',
        path: [],
        currentPageIdx: -1,
      },
      title: 'Groups you manage',
    });
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }
}
