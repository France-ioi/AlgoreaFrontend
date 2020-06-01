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
import { GroupActiveTabComponent } from './group-content/group-active-tab/group-active-tab.component';

@NgModule({
  declarations: [
    GroupComponent,
    GroupHeaderComponent,
    GroupContentComponent,
    GroupOverviewComponent,
    GroupManageComponent,
    PendingRequestComponent,
    GroupActiveTabComponent,
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    CoreModule,
  ],
})
export class GroupModule {}
