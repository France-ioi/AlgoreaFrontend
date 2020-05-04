import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from 'projects/dev/src/app/app.component';

const routes: Routes = [
  {
    path: 'dev',
    component: AppComponent,
    children: [
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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
