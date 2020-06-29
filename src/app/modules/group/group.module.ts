import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SimpleComponentsModule } from '../simple-components/simple-components.module';

import { GroupRoutingModule } from './group-routing.module';

import { GroupComponent } from './group.component';
import { GroupHeaderComponent } from './components/group-header/group-header.component';
import { GroupContentComponent } from './components/group-content/group-content.component';
import { GroupOverviewComponent } from './components/group-overview/group-overview.component';
import { GroupManageComponent } from './components/group-manage/group-manage.component';
import { PendingRequestComponent } from './components/pending-request/pending-request.component';
import { GroupCompositionComponent } from './components/group-composition/group-composition.component';
import { GroupAdministrationComponent } from './components/group-administration/group-administration.component';
import { GroupSettingsComponent } from './components/group-settings/group-settings.component';
import { GroupNoPermissionComponent } from './components/group-no-permission/group-no-permission.component';
import { GroupJoinByCodeComponent } from './components/group-join-by-code/group-join-by-code.component';

import {
  CodeNotSetPipe, CodeUnusedPipe, CodeInUsePipe, CodeExpiredPipe,
  CodeTimeSinceFirstUsePipe, CodeTimeBeforeExpirationPipe
} from '../../shared/models/group.pipe';

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
    CodeNotSetPipe, CodeUnusedPipe, CodeInUsePipe, CodeExpiredPipe,
    CodeTimeSinceFirstUsePipe, CodeTimeBeforeExpirationPipe,
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    SimpleComponentsModule,
  ],
})

export class GroupModule {}
