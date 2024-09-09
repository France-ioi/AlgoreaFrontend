import { Routes } from '@angular/router';
import { PendingChangesGuard } from 'src/app/guards/pending-changes-guard';
import { MyGroupsComponent } from './containers/my-groups/my-groups.component';
import { UserComponent } from './containers/user/user.component';
import { GroupByIdComponent } from './group-by-id.component';
import { ManageGroupsComponent } from 'src/app/groups/containers/manage-groups/manage-groups.component';
import { PageNotFoundComponent } from '../containers/page-not-found/page-not-found.component';
import { DefaultLayoutInitService } from '../services/layout.service';

const routes: Routes = [
  {
    path: 'mine',
    component: MyGroupsComponent,
  },
  {
    path: 'manage',
    component: ManageGroupsComponent,
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
  {
    path: '**',
    component: PageNotFoundComponent,
    canActivate: [ DefaultLayoutInitService ]
  },
];

export default routes;
