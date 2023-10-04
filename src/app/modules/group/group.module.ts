import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupRoutingModule } from './group-routing.module';

import { GroupHeaderComponent } from './components/group-header/group-header.component';
import { GroupNoPermissionComponent } from './components/group-no-permission/group-no-permission.component';
import { GroupJoinByCodeComponent } from './components/group-join-by-code/group-join-by-code.component';

import { GroupOverviewComponent } from './pages/group-overview/group-overview.component';
import { GroupCompositionComponent } from './pages/group-composition/group-composition.component';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { DurationToMinPipe } from 'src/app/shared/pipes/duration';
import { GroupInviteUsersComponent } from './components/group-invite-users/group-invite-users.component';
import { GroupManagerListComponent } from './components/group-manager-list/group-manager-list.component';
import { CurrentUserComponent } from './pages/current-user/current-user.component';
import { GroupEditComponent } from './pages/group-edit/group-edit.component';
import { GroupByIdComponent } from './pages/group-by-id/group-by-id.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MemberListComponent } from './components/member-list/member-list.component';
import { GroupCompositionFilterComponent } from './components/group-composition-filter/group-composition-filter.component';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { JoinedGroupListComponent } from './components/joined-group-list/joined-group-list.component';
import { UserGroupInvitationsComponent } from './components/user-group-invitations/user-group-invitations.component';
import { PendingRequestComponent } from './components/pending-request/pending-request.component';
import { PendingJoinRequestsComponent } from './components/pending-join-requests/pending-join-requests.component';
import { AddSubGroupComponent } from './components/add-sub-group/add-sub-group.component';
import { ManagedGroupListComponent } from './components/managed-group-list/managed-group-list.component';
import { AssociatedItemComponent } from './components/associated-item/associated-item.component';
import { GroupIndicatorComponent } from './components/group-indicator/group-indicator.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { GroupDeleteService } from './services/group-delete.service';
import { GroupRemoveButtonComponent } from './components/group-remove-button/group-remove-button.component';
import { GroupLinksComponent } from './components/group-links/group-links.component';
import { UserComponent } from './pages/user/user.component';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { GroupLogViewComponent } from './components/group-log-view/group-log-view.component';
import { AddGroupComponent } from './components/add-group/add-group.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { GroupAccessComponent } from './pages/group-access/group-access.component';
import { GroupManagersComponent } from './pages/group-managers/group-managers.component';
import { DialogModule } from 'primeng/dialog';
import { ManagerPermissionDialogComponent } from './components/manager-permission-dialog/manager-permission-dialog.component';
import { GroupPermissionsComponent } from './components/group-permissions/group-permissions.component';
import { GroupLeaveComponent } from './components/group-leave/group-leave.component';
import { GroupManagerAddComponent } from './components/group-manager-add/group-manager-add.component';
import { PlatformSettingsComponent } from './pages/platform-settings/platform-settings.component';
import { UserIndicatorComponent } from './components/user-indicator/user-indicator.component';

@NgModule({
  imports: [
    CommonModule,
    GroupRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    OverlayPanelModule,
    DialogModule,
    GroupHeaderComponent,
    GroupOverviewComponent,
    GroupCompositionComponent,
    MyGroupsComponent,
    GroupNoPermissionComponent,
    GroupJoinByCodeComponent,
    DurationToMinPipe,
    GroupInviteUsersComponent,
    GroupManagerListComponent,
    CurrentUserComponent,
    GroupEditComponent,
    GroupByIdComponent,
    MemberListComponent,
    GroupCompositionFilterComponent,
    JoinedGroupListComponent,
    PendingJoinRequestsComponent,
    UserGroupInvitationsComponent,
    PendingRequestComponent,
    AddSubGroupComponent,
    ManagedGroupListComponent,
    AssociatedItemComponent,
    GroupRemoveButtonComponent,
    GroupIndicatorComponent,
    GroupLinksComponent,
    UserComponent,
    UserHeaderComponent,
    UserIndicatorComponent,
    GroupLogViewComponent,
    AddGroupComponent,
    GroupManagersComponent,
    GroupAccessComponent,
    ManagerPermissionDialogComponent,
    GroupPermissionsComponent,
    GroupLeaveComponent,
    GroupManagerAddComponent,
    PlatformSettingsComponent,
  ],
  exports: [
    GroupIndicatorComponent,
  ],
  providers: [
    PendingChangesGuard,
    GroupDeleteService
  ]
})

export class GroupModule {}
