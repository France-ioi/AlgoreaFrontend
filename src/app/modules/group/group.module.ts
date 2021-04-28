import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedComponentsModule } from '../shared-components/shared-components.module';

import { GroupRoutingModule } from './group-routing.module';

import { GroupHeaderComponent } from './components/group-header/group-header.component';
import { GroupNoPermissionComponent } from './components/group-no-permission/group-no-permission.component';
import { GroupJoinByCodeComponent } from './components/group-join-by-code/group-join-by-code.component';

import { GroupOverviewComponent } from './pages/group-overview/group-overview.component';
import { GroupAdministrationComponent } from './pages/group-administration/group-administration.component';
import { GroupSettingsComponent } from './pages/group-settings/group-settings.component';
import { GroupCompositionComponent } from './pages/group-composition/group-composition.component';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
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
import { AssociatedActivityComponent } from './components/associated-activity/associated-activity.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@NgModule({
  declarations: [
    GroupHeaderComponent,
    GroupOverviewComponent,
    GroupCompositionComponent,
    GroupAdministrationComponent,
    MyGroupsComponent,
    GroupDetailsComponent,
    GroupSettingsComponent,
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
    AssociatedActivityComponent,
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    RippleModule,
  ],
  providers: [
    PendingChangesGuard,
  ]
})

export class GroupModule {}
