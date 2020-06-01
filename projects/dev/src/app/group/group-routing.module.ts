import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupComponent } from './group.component';
import { GroupManageComponent } from './group-manage/group-manage.component';
import { GroupContentComponent } from './group-content/group-content.component';
import { GroupActiveTabComponent } from './group-content/group-active-tab/group-active-tab.component';

const routes: Routes = [
  {
    path: 'managed',
    children: [
      {
        path: ':id',
        component: GroupManageComponent,
      }
    ]
  },
  {
    path: 'memberships/:id',
    component: GroupComponent,
  },
  {
    path: ':id',
    component: GroupContentComponent,
    children: [
      {
        path: 'overview',
        component: GroupActiveTabComponent,
      },
      {
        path: 'members',
        component: GroupActiveTabComponent,
      },
      {
        path: 'managers',
        component: GroupActiveTabComponent,
      },
      {
        path: 'settings',
        component: GroupActiveTabComponent,
      },
      {
        path: '**',
        redirectTo: 'overview'
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
