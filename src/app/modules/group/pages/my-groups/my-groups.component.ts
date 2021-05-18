import { Component, OnDestroy, ViewChild } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { JoinedGroupListComponent } from '../../components/joined-group-list/joined-group-list.component';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ]
})
export class MyGroupsComponent implements OnDestroy {
  @ViewChild('joinedGroupList') joinedGroupList?: JoinedGroupListComponent;

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.current.next(contentInfo({
      breadcrumbs: {
        category: $localize`My groups`,
        path: [],
        currentPageIdx: -1
      }
    }));
  }

  ngOnDestroy(): void {
    this.currentContent.current.next(null);
  }

  onGroupJoined(): void {
    this.joinedGroupList?.refresh();
  }

}
