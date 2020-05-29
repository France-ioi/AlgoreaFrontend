import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupComponent } from './group.component';
import { GroupManageComponent } from './group-manage/group-manage.component';
import { GroupContentComponent } from './group-content/group-content.component';

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
    children: [
      {
        path: 'overview',
        component: GroupContentComponent,
        data: {
          active: 0
        }
      },
      {
        path: 'members',
        component: GroupContentComponent,
        data: {
          active: 1
        }
      },
      {
        path: 'managers',
        component: GroupContentComponent,
        data: {
          active: 2
        }
      },
      {
        path: 'settings',
        component: GroupContentComponent,
        data: {
          active: 3
        }
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
