import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { APPCONFIG } from 'src/app/app.config';
import { groupInfo } from 'src/app/models/content/group-info';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { CurrentContentService } from 'src/app/services/current-content.service';
import {
  CanCurrentUserGrantGroupAccessPipe,
  IsCurrentUserManagerPipe,
  CanCurrentUserManageMembersAndGroupPipe
} from './models/group-management';
import { GroupEditComponent } from './containers/group-edit/group-edit.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { GroupAccessComponent } from './containers/group-access/group-access.component';
import { GroupManagersComponent } from './containers/group-managers/group-managers.component';
import { GroupCompositionComponent } from './containers/group-composition/group-composition.component';
import { GroupOverviewComponent } from './containers/group-overview/group-overview.component';
import { GroupIndicatorComponent } from './containers/group-indicator/group-indicator.component';
import { GroupHeaderComponent } from './containers/group-header/group-header.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromGroupContent } from './store';
import { breadcrumbServiceTag } from '../items/data-access/get-breadcrumb.service';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from '../utils/errors';
import { GroupData, selectGroupData } from './models/group-data';
import { readyData } from '../utils/operators/state';
import { GroupLogViewComponent } from 'src/app/groups/containers/group-log-view/group-log-view.component';
import { IsCurrentUserMemberPipe } from './models/group-membership';

@Component({
  selector: 'alg-group-by-id',
  templateUrl: './group-by-id.component.html',
  styleUrls: [ './group-by-id.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    GroupHeaderComponent,
    GroupIndicatorComponent,
    RouterLinkActive,
    RouterLink,
    GroupOverviewComponent,
    GroupCompositionComponent,
    GroupManagersComponent,
    GroupAccessComponent,
    GroupEditComponent,
    LoadingComponent,
    ErrorComponent,
    AsyncPipe,
    GroupLogViewComponent,
    IsCurrentUserManagerPipe,
    IsCurrentUserMemberPipe,
    CanCurrentUserGrantGroupAccessPipe,
    CanCurrentUserManageMembersAndGroupPipe,
  ],
})
export class GroupByIdComponent implements OnDestroy {
  private config = inject(APPCONFIG);

  state$ = this.store.select(selectGroupData);

  hideAccessTab = !this.config.featureFlags.showGroupAccessTab;

  // use of ViewChild required as these elements are shown under some conditions, so may be undefined
  @ViewChild('overviewTab') overviewTab?: RouterLinkActive;
  @ViewChild('compositionTab') compositionTab?: RouterLinkActive;
  @ViewChild('adminTab') adminTab?: RouterLinkActive;
  @ViewChild('settingsTab') settingsTab?: RouterLinkActive;
  @ViewChild('accessTab') accessTab?: RouterLinkActive;
  @ViewChild('groupEdit') groupEdit?: GroupEditComponent;

  // on state change, update current content page info (for breadcrumb)
  private groupToCurrentContentSubscription = this.state$.pipe(readyData<GroupData>()).subscribe(({ route }) => {
    this.currentContent.replace(groupInfo({ route }));
  });

  private initialCurrentContentSubscription = this.store.select(fromGroupContent.selectActiveContentFullRoute).subscribe(route => {
    if (route) {
      // just publish to current content the new route we are navigating to (without knowing any info)
      this.currentContent.replace(groupInfo({
        route,
      }));
    } else {
      this.currentContent.clear();
    }
  });

  private breadcrumbsErrorSubscription = this.store.select(fromGroupContent.selectActiveContentBreadcrumbsState).subscribe(state => {
    if (state === null) return; // state is null when there is no path
    if (state.isError) this.currentContent.clear();

    // If path is incorrect, redirect to same page without path to trigger the solve missing path at next navigation
    if (
      state.isError &&
      errorHasTag(state.error, breadcrumbServiceTag) &&
      (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))
    ) {
      if (this.hasRedirected) throw new Error('Too many redirections (unexpected)');
      this.hasRedirected = true;
      const id = state.identifier?.id;
      if (!id) throw new Error('Unexpected: group id should exist');
      this.groupRouter.navigateTo(rawGroupRoute({ id, isUser: false }), { navExtras: { replaceUrl: true } });
    }
    if (state.isReady) this.hasRedirected = false;
  });


  private hasRedirected = false;

  constructor(
    private store: Store,
    private currentContent: CurrentContentService,
    private groupRouter: GroupRouter,
    private currentContentService: CurrentContentService,
  ) {}

  ngOnDestroy(): void {
    this.currentContent.clear();
    this.groupToCurrentContentSubscription.unsubscribe();
    this.breadcrumbsErrorSubscription.unsubscribe();
    this.initialCurrentContentSubscription.unsubscribe();
  }

  isDirty(): boolean {
    return !!this.groupEdit?.isDirty();
  }

  refreshNav(): void {
    this.currentContentService.forceNavMenuReload();
  }

  onGroupRefreshRequired(): void {
    this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    this.refreshNav();
  }

}
