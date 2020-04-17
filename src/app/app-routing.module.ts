import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './view-component/task/task.component';
import { YourselfComponent } from './view-component/yourself/yourself.component';
import { GroupComponent } from './view-component/group/group.component';
import { HomePageComponent } from './view-component/home-page/home-page.component';
import { GroupInfoComponent } from './view-component/group-views/group-info/group-info.component';
import { NotificationViewComponent } from './view-component/notification-view/notification-view.component';


const routes: Routes = [
  {
    path: 'task/:id',
    component: TaskComponent
  },
  {
    path: 'yourself',
    component: YourselfComponent
  },
  {
    path: 'groups',
    children: [
      {
        path: 'managed/:id',
        component: GroupComponent
      },
      {
        path: 'memberships/:id',
        component: GroupComponent
      },
      {
        path: 'managed',
        component: GroupInfoComponent,
        data: {
          src: 'managed'
        }
      },
      {
        path: 'memberships',
        component: GroupInfoComponent,
        data: {
          src: 'memberships'
        }
      }
    ]
  },
  {
    path: 'home',
    component: HomePageComponent
  },
  {
    path: 'notification',
    component: NotificationViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
