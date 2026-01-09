import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserSessionService } from 'src/app/services/user-session.service';
import { delay } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { AddGroupComponent } from 'src/app/groups/containers/add-group/add-group.component';
import { ManagedGroupListComponent } from 'src/app/groups/containers/managed-group-list/managed-group-list.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { myGroupsInfo } from 'src/app/models/content/group-info';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { Store } from '@ngrx/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { managedGroupsPage } from 'src/app/models/routing/group-route';
import { ContentDisplayType, LayoutService } from 'src/app/services/layout.service';

@Component({
  selector: 'alg-manage-groups',
  templateUrl: './manage-groups.component.html',
  styleUrls: [ './manage-groups.component.scss' ],
  imports: [
    AsyncPipe,
    AddGroupComponent,
    ManagedGroupListComponent,
    ErrorComponent,
  ]
})
export class ManageGroupsComponent implements OnInit, OnDestroy {
  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  constructor(
    private store: Store,
    private layoutService: LayoutService,
    private currentContent: CurrentContentService,
    private sessionService: UserSessionService,
  ) {
  }

  ngOnInit(): void {
    this.currentContent.replace(myGroupsInfo({}));
    this.layoutService.configure({ contentDisplayType: ContentDisplayType.Show });
    this.store.dispatch(fromCurrentContent.contentPageActions.changeContent({
      route: managedGroupsPage,
      title: $localize`Manage groups`,
    }));
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }
}
