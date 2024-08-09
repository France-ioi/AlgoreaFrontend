import { Component, OnDestroy, ViewChild } from '@angular/core';
import { myGroupsInfo } from 'src/app/models/content/group-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { JoinedGroupListComponent } from '../joined-group-list/joined-group-list.component';
import { AddGroupComponent } from '../add-group/add-group.component';
import { ManagedGroupListComponent } from '../managed-group-list/managed-group-list.component';
import { AccessCodeViewComponent } from 'src/app/containers/access-code-view/access-code-view.component';
import { UserGroupInvitationsComponent } from '../user-group-invitations/user-group-invitations.component';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/services/user-session.service';
import { AsyncPipe } from '@angular/common';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ],
  standalone: true,
  imports: [
    UserGroupInvitationsComponent,
    JoinedGroupListComponent,
    AccessCodeViewComponent,
    ManagedGroupListComponent,
    AddGroupComponent,
    AsyncPipe,
    ErrorComponent
  ],
})
export class MyGroupsComponent implements OnDestroy {
  @ViewChild('joinedGroupList') joinedGroupList?: JoinedGroupListComponent;

  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  constructor(
    private currentContent: CurrentContentService,
    private sessionService: UserSessionService,
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
