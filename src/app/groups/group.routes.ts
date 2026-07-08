import { Routes } from '@angular/router';
import { PendingChangesGuard } from 'src/app/guards/pending-changes-guard';
import { MyGroupsComponent } from './containers/my-groups/my-groups.component';
import { UserComponent } from './containers/user/user.component';
import { GroupByIdComponent } from './group-by-id.component';
import { ManageGroupsComponent } from 'src/app/groups/containers/manage-groups/manage-groups.component';
import { PageNotFoundComponent } from '../containers/page-not-found/page-not-found.component';
import { ContentDisplayType, DefaultLayoutInitService } from '../services/layout.service';
import { groupPathRouterSubPrefix, managedGroupsPage, myGroupsPage, userPathRouterSubPrefix } from '../models/routing/group-route';

const routes: Routes = [
  {
    path: myGroupsPage,
    component: MyGroupsComponent,
    canActivate: [ DefaultLayoutInitService ],
    data: { contentDisplayType: ContentDisplayType.Show },
  },
  {
    path: managedGroupsPage,
    component: ManageGroupsComponent,
    canActivate: [ DefaultLayoutInitService ],
    data: { contentDisplayType: ContentDisplayType.Show },
  },
  {
    path: userPathRouterSubPrefix + '/:id',
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
    path: groupPathRouterSubPrefix + '/:id',
    component: GroupByIdComponent,
    canDeactivate: [ PendingChangesGuard ],
    children: [ /* if you change routes here, update `isGroupPage` as well! */
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./containers/group-overview/group-overview-page.component').then(m => m.GroupOverviewPageComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./containers/group-log-view/group-log-view-page.component').then(m => m.GroupLogViewPageComponent),
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./containers/group-members/group-members-page.component').then(m => m.GroupMembersPageComponent),
      },
      {
        path: 'sub-groups',
        loadComponent: () =>
          import('./containers/group-sub-groups/group-sub-groups-page.component').then(m => m.GroupSubGroupsPageComponent),
      },
      {
        path: 'managers',
        loadComponent: () =>
          import('./containers/group-managers/group-managers-page.component').then(m => m.GroupManagersPageComponent),
      },
      {
        path: 'settings',
        canDeactivate: [ PendingChangesGuard ],
        loadComponent: () =>
          import('./containers/group-edit/group-edit.component').then(m => m.GroupEditComponent),
      },
      {
        path: 'access',
        loadComponent: () =>
          import('./containers/group-access/group-access-page.component').then(m => m.GroupAccessPageComponent),
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
