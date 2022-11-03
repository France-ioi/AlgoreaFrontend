import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyGroupsComponent } from './pages/my-groups/my-groups.component';
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
    children: [ /* if you change routes here, update `isUserPage` as well! */
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
    canDeactivate: [ PendingChangesGuard ],
    children: [ /* if you change routes here, update `isGroupPage` as well! */
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
    ],
  },
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class GroupRoutingModule {}
