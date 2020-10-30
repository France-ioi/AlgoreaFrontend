import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { ManagedGroupsComponent } from './pages/managed-groups/managed-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
import { GroupOverviewComponent } from './pages/group-overview/group-overview.component';
import { GroupCompositionComponent } from './pages/group-composition/group-composition.component';
import { GroupAdministrationComponent } from './pages/group-administration/group-administration.component';
import { GroupSettingsComponent } from './pages/group-settings/group-settings.component';
import { JoinedGroupsComponent } from './pages/joined-groups/joined-groups.component';

const routes: Routes = [
  {
    path: 'mine',
    component: MyGroupsComponent,
  },
  {
    path: 'managed',
    component: ManagedGroupsComponent,
  },
  {
    path: 'joined',
    component: JoinedGroupsComponent,
  },
  {
    path: 'details/:id',
    component: GroupDetailsComponent,
    children: [
      {
        path: '',
        component: GroupOverviewComponent,
      },
      {
        path: 'members',
        component: GroupCompositionComponent,
      },
      {
        path: 'managers',
        component: GroupAdministrationComponent,
      },
      {
        path: 'settings',
        component: GroupSettingsComponent,
      }
    ]
  }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class GroupRoutingModule {}
