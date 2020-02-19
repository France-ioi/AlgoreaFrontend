import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { TableModule } from 'primeng/table';
import { BasicComponentModule } from '../basic-component/basic-component.module';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';

import { TaskTabComponent } from './task/task-tab/task-tab.component';
import { TaskComponent } from './task/task.component';
import { TaskHeaderComponent } from './task/task-header/task-header.component';
import { YourselfComponent } from './yourself/yourself.component';
import { YourselfTabComponent } from './yourself/yourself-tab/yourself-tab.component';
import { YourselfHeaderComponent } from './yourself/yourself-header/yourself-header.component';
import { GroupComponent } from './group/group.component';
import { GroupHeaderComponent } from './group/group-header/group-header.component';
import { GroupTabComponent } from './group/group-tab/group-tab.component';
import { MatMenuModule } from '@angular/material';
import { HomePageComponent } from './home-page/home-page.component';
import { PendingRequestViewComponent } from './requests-view/pending-request-view/pending-request-view.component';
import { GradingRequestViewComponent } from './requests-view/grading-request-view/grading-request-view.component';
import { AccessCodeViewComponent } from './activities/headers/access-code-view/access-code-view.component';
import { AttemptsViewComponent } from './activities/headers/attempts-view/attempts-view.component';
import { SessionViewComponent } from './activities/content/sessions/session-view/session-view.component';
import { SessionsComponent } from './activities/content/sessions/sessions.component';
import { MosaicsComponent } from './activities/content/mosaics/mosaics.component';
import { MosaicItemComponent } from './activities/content/mosaics/mosaic-item/mosaic-item.component';
import { EditModeComponent } from './activities/settings/edit-mode/edit-mode.component';
import { NewContentComponent } from './activities/content/edit-mode/new-content/new-content.component';
import { NewContentTypeComponent } from './activities/content/edit-mode/new-content/new-content-type/new-content-type.component';
import { GroupSettingsComponent } from './groups/settings/group-settings.component';
import { GroupOverviewComponent } from './groups/overview/group-overview.component';
import { YourselfOverviewComponent } from './yourself/yourself-tab/yourself-overview/yourself-overview.component';
import { GroupInfoComponent } from './groups/group-info/group-info.component';
import { GroupJoinedComponent } from './groups/group-info/group-joined/group-joined.component';
import { GroupManageComponent } from './groups/group-info/group-manage/group-manage.component';
import { PendingInvitationViewComponent } from './requests-view/pending-invitation-view/pending-invitation-view.component';
import { GroupCompositionComponent } from './groups/composition/group-composition.component';


@NgModule({
  declarations: [
    TaskTabComponent,
    TaskHeaderComponent,
    TaskComponent,
    YourselfComponent,
    YourselfTabComponent,
    YourselfHeaderComponent,
    GroupComponent,
    GroupHeaderComponent,
    GroupTabComponent,
    HomePageComponent,
    PendingRequestViewComponent,
    GradingRequestViewComponent,
    AccessCodeViewComponent,
    AttemptsViewComponent,
    SessionViewComponent,
    SessionsComponent,
    MosaicsComponent,
    MosaicItemComponent,
    EditModeComponent,
    NewContentComponent,
    NewContentTypeComponent,
    GroupSettingsComponent,
    GroupOverviewComponent,
    YourselfOverviewComponent,
    GroupInfoComponent,
    GroupJoinedComponent,
    GroupManageComponent,
    PendingInvitationViewComponent,
    GroupCompositionComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    TableModule,
    BasicComponentModule,
    TieredMenuModule,
    TooltipModule,
    MatMenuModule
  ],
  exports: [
    TaskTabComponent,
    TaskHeaderComponent,
    TaskComponent,
    YourselfComponent,
    YourselfTabComponent,
    YourselfHeaderComponent,
    GroupComponent,
    GroupHeaderComponent,
    GroupTabComponent
  ]
})
export class ViewComponentModule { }
