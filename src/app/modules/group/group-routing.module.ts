import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
import { GroupDetailsComponent } from './pages/group-details/group-details.component';
import { GroupEditComponent } from './pages/group-edit/group-edit.component';
import { GroupByIdComponent } from './pages/group-by-id/group-by-id.component';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { GroupUserComponent } from './pages/group-user/group-user.component';

const routes: Routes = [
  {
    path: 'mine',
    component: MyGroupsComponent,
  },
  {
    path: 'users/:id',
    component: GroupUserComponent,
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
          },
        ]
      },
      {
        path: 'edit',
        component: GroupEditComponent,
        canDeactivate: [ PendingChangesGuard ]
      },
    ],
  },
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class GroupRoutingModule {}
