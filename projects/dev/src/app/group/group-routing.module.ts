import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupComponent } from './group.component';
import { GroupManageComponent } from './group-manage/group-manage.component';


const routes: Routes = [
  {
    path: 'managed',
    component: GroupComponent,
    children: [
      {
        path: ':id',
        component: GroupManageComponent
      }
    ]
  },
  {
    path: 'memberships/:id',
    component: GroupComponent
  },
  {
    path: '**',
    component: GroupComponent
  }
  // {
  //   path: 'managed',
  //   component: GroupInfoComponent,
  //   data: {
  //     src: 'managed'
  //   }
  // },
  // {
  //   path: 'memberships',
  //   component: GroupInfoComponent,
  //   data: {
  //     src: 'memberships'
  //   }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupRoutingModule { }
