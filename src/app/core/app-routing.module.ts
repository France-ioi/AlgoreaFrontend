import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'groups',
    loadChildren: () => import('../modules/group/group.module').then(m => m.GroupModule)
  },
  {
    path: 'items',
    loadChildren: () => import('../modules/item/item.module').then(m => m.ItemModule)
  },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
