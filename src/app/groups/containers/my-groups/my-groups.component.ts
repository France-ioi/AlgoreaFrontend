import { Component, OnDestroy, ViewChild } from '@angular/core';
import { myGroupsInfo } from 'src/app/models/content/group-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { JoinedGroupListComponent } from '../joined-group-list/joined-group-list.component';
import { AddGroupComponent } from '../add-group/add-group.component';
import { ManagedGroupListComponent } from '../managed-group-list/managed-group-list.component';
import { AccessCodeViewComponent } from 'src/app/containers/access-code-view/access-code-view.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { UserGroupInvitationsComponent } from '../user-group-invitations/user-group-invitations.component';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ],
  standalone: true,
  imports: [
    UserGroupInvitationsComponent,
    SectionComponent,
    JoinedGroupListComponent,
    AccessCodeViewComponent,
    ManagedGroupListComponent,
    AddGroupComponent
  ],
})
export class MyGroupsComponent implements OnDestroy {
  @ViewChild('joinedGroupList') joinedGroupList?: JoinedGroupListComponent;

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.replace(myGroupsInfo({
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
    this.currentContent.forceNavMenuReload();
  }

}
