import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupComponent } from './group.component';
import { GroupManageComponent } from './group-manage/group-manage.component';
import { GroupOverviewComponent } from './group-overview/group-overview.component';
import { GroupAdministrationComponent } from './group-administration/group-administration.component';
import { GroupCompositionComponent } from './group-composition/group-composition.component';
import { GroupSettingsComponent } from './group-settings/group-settings.component';

const routes: Routes = [
  {
    path: 'memberships/:id',
    component: GroupComponent,
  },
  {
    path: ':id',
    component: GroupManageComponent,
    children: [
      {
        path: '',
        component: GroupOverviewComponent,
      },
      {
        path: 'members',
        component: GroupCompositionComponent
      },
      {
        path: 'managers',
        component: GroupAdministrationComponent
      },
      {
        path: 'settings',
        component: GroupSettingsComponent
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  },
  {
    path: '**',
    component: GroupComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupRoutingModule {}
