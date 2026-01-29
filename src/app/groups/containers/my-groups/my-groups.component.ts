import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { myGroupsInfo } from 'src/app/models/content/group-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { JoinedGroupListComponent } from '../joined-group-list/joined-group-list.component';
import { AccessCodeViewComponent } from 'src/app/containers/access-code-view/access-code-view.component';
import { UserGroupInvitationsComponent } from '../user-group-invitations/user-group-invitations.component';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/services/user-session.service';
import { AsyncPipe } from '@angular/common';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { myGroupsPage } from 'src/app/models/routing/group-route';
import { Store } from '@ngrx/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';

@Component({
  selector: 'alg-my-groups',
  templateUrl: './my-groups.component.html',
  styleUrls: [ './my-groups.component.scss' ],
  imports: [
    UserGroupInvitationsComponent,
    JoinedGroupListComponent,
    AccessCodeViewComponent,
    AsyncPipe,
    ErrorComponent
  ]
})
export class MyGroupsComponent implements OnDestroy, OnInit {
  private store = inject(Store);
  private layoutService = inject(LayoutService);
  private currentContent = inject(CurrentContentService);
  private sessionService = inject(UserSessionService);

  @ViewChild('joinedGroupList') joinedGroupList?: JoinedGroupListComponent;

  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  ngOnInit(): void {
    this.currentContent.replace(myGroupsInfo({}));
    this.layoutService.configure({ contentDisplayType: ContentDisplayType.Show });
    this.store.dispatch(fromCurrentContent.contentPageActions.changeContent({
      route: myGroupsPage,
      title: $localize`My groups`,
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
