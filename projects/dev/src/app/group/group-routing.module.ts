import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupComponent } from './group.component';
import { GroupManageComponent } from './group-manage/group-manage.component';
import { GroupContentComponent } from './group-content/group-content.component';

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
        component: GroupContentComponent,
      },
      {
        path: 'members',
        component: GroupContentComponent,
      },
      {
        path: 'managers',
        component: GroupContentComponent,
      },
      {
        path: 'settings',
        component: GroupContentComponent,
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
