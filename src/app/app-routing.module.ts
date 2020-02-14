import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './view-component/task/task.component';
import { YourselfComponent } from './view-component/yourself/yourself.component';
import { GroupComponent } from './view-component/group/group.component';
import { HomePageComponent } from './view-component/home-page/home-page.component';


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
    path: 'group',
    component: GroupComponent
  },
  {
    path: 'home',
    component: HomePageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
