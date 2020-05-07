import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DesignAppModule } from 'projects/design/src/app/app.module';
import { DevAppModule } from 'projects/dev/src/app/app.module';


const routes: Routes = [
  { path: 'design', loadChildren: () => import('projects/design/src/app/app.module').then(m => m.DesignAppModule) },
  { path: 'dev', loadChildren: () => import('projects/dev/src/app/app.module').then(m => m.DevAppModule) },
  { path: '**', redirectTo: '/design' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true }),
    DesignAppModule.forRoot(),
    DevAppModule.forRoot()
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
