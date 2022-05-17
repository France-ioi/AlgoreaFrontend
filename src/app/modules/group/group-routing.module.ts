import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
import { GroupByIdComponent } from './pages/group-by-id/group-by-id.component';
import { UserComponent } from './pages/user/user.component';
import { PendingChangesGuard } from '../../shared/guards/pending-changes-guard';
import { GroupSettingsComponent } from './pages/group-settings/group-settings.component';

const routes: Routes = [
  {
    path: 'mine',
    component: MyGroupsComponent,
  },
  {
    path: 'users/:id',
    component: UserComponent,
    children: [
      {
        path: 'personal-data'
      }
    ]
  },
  {
    path: 'by-id/:id',
    component: GroupByIdComponent,
    children: [
      {
        path: 'details',
        component: GroupDetailsComponent,
        children: [
          {
            path: '',
          },
          {
            path: 'members',
          },
          {
            path: 'managers',
          },
          {
            path: 'settings',
            canDeactivate: [ PendingChangesGuard ],
            component: GroupSettingsComponent,
          },
          {
            path: 'access',
          },
        ]
      },
    ],
  },
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class GroupRoutingModule {}
