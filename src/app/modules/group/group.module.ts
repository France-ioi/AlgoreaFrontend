import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SimpleComponentsModule } from '../simple-components/simple-components.module';

import { GroupRoutingModule } from './group-routing.module';

import { GroupComponent } from './group.component';
import { GroupHeaderComponent } from './components/group-header/group-header.component';
import { PendingRequestComponent } from './components/pending-request/pending-request.component';
import { GroupNoPermissionComponent } from './components/group-no-permission/group-no-permission.component';
import { GroupJoinByCodeComponent } from './components/group-join-by-code/group-join-by-code.component';

import {
  CodeNotSetPipe, CodeUnusedPipe, CodeInUsePipe, CodeExpiredPipe,
  DurationSinceFirstCodeUsePipe, DurationBeforeCodeExpirationPipe,
  CodeLifetimePipe
} from './pipes/group.pipe';
import { GroupOverviewComponent } from './pages/group-overview/group-overview.component';
import { GroupAdministrationComponent } from './pages/group-administration/group-administration.component';
import { GroupSettingsComponent } from './pages/group-settings/group-settings.component';
import { GroupCompositionComponent } from './pages/group-composition/group-composition.component';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { ManagedGroupsComponent } from './pages/managed-groups/managed-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
import { DurationToMinPipe } from 'src/app/shared/pipes/duration';

@NgModule({
  declarations: [
    GroupComponent,
    GroupHeaderComponent,
    GroupOverviewComponent,
    PendingRequestComponent,
    GroupCompositionComponent,
    GroupAdministrationComponent,
    MyGroupsComponent,
    ManagedGroupsComponent,
    GroupDetailsComponent,
    GroupSettingsComponent,
    GroupNoPermissionComponent,
    GroupJoinByCodeComponent,
    CodeNotSetPipe, CodeUnusedPipe, CodeInUsePipe, CodeExpiredPipe,
    DurationSinceFirstCodeUsePipe, DurationBeforeCodeExpirationPipe,
    DurationToMinPipe, CodeLifetimePipe
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    SimpleComponentsModule,
  ],
})

export class GroupModule {}
