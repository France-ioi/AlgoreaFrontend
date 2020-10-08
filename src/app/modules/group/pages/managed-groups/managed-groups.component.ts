import { Component, OnInit } from '@angular/core';
import { CurrentContentService } from '../../../../shared/services/current-content.service';

const GroupBreadcrumbCat = 'Groups';

@Component({
  selector: 'alg-managed-groups',
  templateUrl: './managed-groups.component.html',
  styleUrls: ['./managed-groups.component.scss']
})
export class ManagedGroupsComponent implements OnInit {

  title = 'Groups you manage';

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.setCurrent({
      type: 'group',
      breadcrumbs: {
        category: GroupBreadcrumbCat,
        path: [{title: this.title, navigateTo: ['groups', 'managed']}],
        currentPageIdx: 0,
      },
      title: this.title,
    });
  }

  ngOnInit(): void {
  }

}
