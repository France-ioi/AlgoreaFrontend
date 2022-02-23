import { Component, OnDestroy, ViewChild } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { JoinedGroupListComponent } from '../../components/joined-group-list/joined-group-list.component';
import { LayoutService } from '../../../../shared/services/layout.service';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ]
})
export class MyGroupsComponent implements OnDestroy {
  @ViewChild('joinedGroupList') joinedGroupList?: JoinedGroupListComponent;

  fullFrameContent$ = this.layoutService.fullFrameContent$;

  constructor(
    private currentContent: CurrentContentService,
    private layoutService: LayoutService,
  ) {
    this.layoutService.initialize(false, true, true);
    this.currentContent.replace(contentInfo({
      title: $localize`My groups`,
      breadcrumbs: {
        category: $localize`My groups`,
        path: [],
        currentPageIdx: -1
      }
    }));
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }

  onGroupJoined(): void {
    this.joinedGroupList?.refresh();
  }

}
