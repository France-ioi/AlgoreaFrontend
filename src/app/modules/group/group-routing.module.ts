import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
import { GroupByIdComponent } from './pages/group-by-id/group-by-id.component';
import { UserComponent } from './pages/user/user.component';
import { PendingChangesGuard } from '../../shared/guards/pending-changes-guard';

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
        path: 'personal-data',
        children: [],
      },
      {
        path: 'settings',
        children: [],
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
        canDeactivate: [ PendingChangesGuard ],
        children: [
          {
            path: '',
            children: [],
          },
          {
            path: 'members',
            children: [],
          },
          {
            path: 'managers',
            children: [],
          },
          {
            path: 'settings',
            canDeactivate: [ PendingChangesGuard ],
            children: [],
          },
          {
            path: 'access',
            children: [],
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
