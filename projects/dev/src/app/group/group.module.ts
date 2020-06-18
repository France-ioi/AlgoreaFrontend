import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoreModule } from 'core';

import { GroupRoutingModule } from './group-routing.module';

import { GroupComponent } from './group.component';
import { GroupHeaderComponent } from './group-header/group-header.component';
import { GroupContentComponent } from './group-content/group-content.component';
import { GroupOverviewComponent } from './group-content/group-overview/group-overview.component';
import { GroupManageComponent } from './group-manage/group-manage.component';
import { PendingRequestComponent } from './group-manage/pending-request/pending-request.component';
import { GroupCompositionComponent } from './group-content/group-composition/group-composition.component';
import { GroupAdministrationComponent } from './group-content/group-administration/group-administration.component';
import { GroupSettingsComponent } from './group-content/group-settings/group-settings.component';
import { GroupNoPermissionComponent } from './group-content/group-no-permission/group-no-permission.component';
import { GroupJoinByCodeComponent } from './group-join-by-code/group-join-by-code.component';

@NgModule({
  declarations: [
    GroupComponent,
    GroupHeaderComponent,
    GroupContentComponent,
    GroupOverviewComponent,
    GroupManageComponent,
    PendingRequestComponent,
    GroupCompositionComponent,
    GroupAdministrationComponent,
    GroupSettingsComponent,
    GroupNoPermissionComponent,
    GroupJoinByCodeComponent,
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    CoreModule,
  ],
})
export class GroupModule {}
