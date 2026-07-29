import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { APPCONFIG } from 'src/app/config';
import { groupInfo } from 'src/app/models/content/group-info';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { CurrentContentService } from 'src/app/services/current-content.service';
import {
  CanCurrentUserGrantGroupAccessPipe,
  IsCurrentUserManagerPipe,
  CanCurrentUserManageMembersAndGroupPipe
} from './models/group-management';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { GroupIndicatorComponent } from './containers/group-indicator/group-indicator.component';
import { GroupHeaderComponent } from './containers/group-header/group-header.component';
import { Store } from '@ngrx/store';
import { fromGroupContent } from './store';
import { breadcrumbServiceTag } from '../items/data-access/get-breadcrumb.service';
import { errorHasTag, errorIsHTTPForbidden, errorIsHTTPNotFound } from '../utils/errors';
import { selectGroupData } from './models/group-data';
import { IsCurrentUserMemberPipe } from './models/group-membership';
import { IsHttpForbiddenPipe } from '../utils/error-handling/http-error.pipes';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { PendingChangesService } from 'src/app/services/pending-changes-service';

@Component({
  selector: 'alg-group-by-id',
  templateUrl: './group-by-id.component.html',
  styleUrl: './group-by-id.component.scss',
  imports: [
    GroupHeaderComponent,
    GroupIndicatorComponent,
    RouterLinkActive,
    RouterLink,
    RouterOutlet,
    LoadingComponent,
    ErrorComponent,
    IsCurrentUserManagerPipe,
    IsCurrentUserMemberPipe,
    CanCurrentUserGrantGroupAccessPipe,
    CanCurrentUserManageMembersAndGroupPipe,
    IsHttpForbiddenPipe,
  ]
})
export class GroupByIdComponent implements OnDestroy, PendingChangesComponent {
  private store = inject(Store);
  private currentContent = inject(CurrentContentService);
  private groupRouter = inject(GroupRouter);
  private config = inject(APPCONFIG);
  private pendingChangesService = inject(PendingChangesService);

  protected readonly groupDataState = this.store.selectSignal(selectGroupData);

  protected readonly groupData = computed(() => {
    const state = this.groupDataState();
    return state.isReady ? state.data : undefined;
  });

  hideAccessTab = !this.config.featureFlags.showGroupAccessTab;

  private readonly activeContentFullRoute = this.store.selectSignal(fromGroupContent.selectActiveContentFullRoute);
  private readonly breadcrumbsState = this.store.selectSignal(fromGroupContent.selectActiveContentBreadcrumbsState);
  private readonly routeErrorHandlingState = this.store.selectSignal(fromGroupContent.selectActiveContentRouteErrorHandlingState);
  // Guards against service redirect loops (wrong path → strip path → recover path → wrong path again). Holds the id
  // of the group we redirected for: scoping per group keeps the guard from staying armed when the user navigates to
  // another group before the path recovery of the previous one settles. A scalar id is safe because only one content
  // is active at a time, so a genuine loop is always same-target.
  private redirectedForGroupId: string | undefined;

  constructor() {
    effect(() => {
      this.applyGroupToCurrentContentSync();
    });
    effect(() => {
      this.applyActiveRouteToCurrentContentSync();
    });
    effect(() => {
      this.applyBreadcrumbsErrorHandling();
    });
    effect(() => {
      this.applyRedirectGuardReset();
    });
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }

  isDirty(): boolean {
    return !!this.pendingChangesService.component?.isDirty();
  }

  onGroupRefreshRequired(): void {
    this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    this.currentContent.forceNavMenuReload();
  }

  private applyGroupToCurrentContentSync(): void {
    const state = this.groupDataState();
    if (!state.isReady) return;
    this.currentContent.replace(groupInfo({ route: state.data.route }));
  }

  private applyActiveRouteToCurrentContentSync(): void {
    const route = this.activeContentFullRoute();
    if (route) {
      this.currentContent.replace(groupInfo({ route }));
    } else {
      this.currentContent.clear();
    }
  }

  private applyBreadcrumbsErrorHandling(): void {
    const state = this.breadcrumbsState();
    if (state === null) return;
    if (state.isError) this.currentContent.clear();

    if (
      state.isError &&
      errorHasTag(state.error, breadcrumbServiceTag) &&
      (errorIsHTTPForbidden(state.error) || errorIsHTTPNotFound(state.error))
    ) {
      const id = state.identifier?.id;
      if (!id) throw new Error('Unexpected: group id should exist');
      if (this.redirectedForGroupId === id) throw new Error('Too many redirections (unexpected)');
      this.redirectedForGroupId = id;
      this.groupRouter.navigateTo(rawGroupRoute({ id, isUser: false }), { navExtras: { replaceUrl: true } });
    }
    if (state.isReady) this.redirectedForGroupId = undefined;
  }

  private applyRedirectGuardReset(): void {
    // Recovering the path after our redirect failed, so no automatic navigation will follow: disarm the loop guard
    // so a later user-initiated navigation back to the failing route is treated as a new redirect, not as a loop.
    // Invariant: a route is either an error route (routeErrorHandlingState non-null) or a valid route whose
    // breadcrumbs may 403 — never both — so clearing here cannot defeat genuine-loop detection.
    if (this.routeErrorHandlingState()?.isError) this.redirectedForGroupId = undefined;
  }

}
