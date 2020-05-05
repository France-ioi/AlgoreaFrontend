import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { TableModule } from 'primeng/table';
// import { BasicComponentModule } from '../basic-component/basic-component.module';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';

import { EditorModule } from '@tinymce/tinymce-angular';

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
import { SettingsEditModeComponent } from './activities/settings/edit-mode/edit-mode.component';
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
import { YourselfPersonalComponent } from './yourself/yourself-tab/yourself-personal/yourself-personal.component';
import { PresentationsComponent } from './activities/content/presentations/presentations.component';
import { PresentationItemComponent } from './activities/content/presentations/presentation-item/presentation-item.component';
import { TeamComponent } from './groups/composition/team/team.component';
import { TeamMemberComponent } from './groups/composition/team/team-member/team-member.component';
import { TeamCompositionComponent } from './groups/composition/team-composition/team-composition.component';
import { NotificationViewComponent } from './notification-view/notification-view.component';
import { NotificationHeaderComponent } from './notification-view/notification-header/notification-header.component';
import { NotificationTabComponent } from './notification-view/notification-tab/notification-tab.component';
import { AssociatedActivitiesComponent } from './skills/associated-activities/associated-activities.component';
import { AssociatedSkillsComponent } from './activities/associated-skills/associated-skills.component';
import { DiscussionComponent } from './activity-skill/discussion/discussion.component';
import { AssociatedActivitiesEditModeComponent } from './skills/associated-activities/edit-mode/edit-mode.component';
import { AssociatedSkillsEditModeComponent } from './activities/associated-skills/edit-mode/edit-mode.component';
import { DiscussionThreadComponent } from './activity-skill/discussion/discussion-thread/discussion-thread.component';
import { RatingBarComponent } from './activity-skill/discussion/discussion-thread/rating-bar/rating-bar.component';
import { GroupRightHeaderComponent } from './group/group-header/group-right-header/group-right-header.component';
import { GroupAdministrationComponent } from './groups/administration/group-administration.component';
import { CoreModule } from 'core';


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
    SettingsEditModeComponent,
    NewContentComponent,
    NewContentTypeComponent,
    GroupSettingsComponent,
    GroupOverviewComponent,
    YourselfOverviewComponent,
    GroupInfoComponent,
    GroupJoinedComponent,
    GroupManageComponent,
    PendingInvitationViewComponent,
    GroupCompositionComponent,
    YourselfPersonalComponent,
    PresentationsComponent,
    PresentationItemComponent,
    TeamComponent,
    TeamMemberComponent,
    TeamCompositionComponent,
    NotificationViewComponent,
    NotificationHeaderComponent,
    NotificationTabComponent,
    AssociatedActivitiesComponent,
    AssociatedSkillsComponent,
    DiscussionComponent,
    AssociatedActivitiesEditModeComponent,
    AssociatedSkillsEditModeComponent,
    DiscussionThreadComponent,
    RatingBarComponent,
    GroupRightHeaderComponent,
    GroupAdministrationComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    TableModule,
    // BasicComponentModule,
    CoreModule,
    TieredMenuModule,
    TooltipModule,
    MatMenuModule,
    EditorModule
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
