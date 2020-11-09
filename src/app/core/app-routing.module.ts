import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { appDefaultItemRoute, itemStringUrl } from '../shared/helpers/item-route';

const routes: Routes = [
  {
    path: '',
    redirectTo: itemStringUrl(appDefaultItemRoute()),
    pathMatch: 'full',
  },
  {
    path: 'groups',
    loadChildren: (): Promise<any> => import('../modules/group/group.module').then(m => m.GroupModule)
  },
  {
    path: 'items',
    loadChildren: (): Promise<any> => import('../modules/item/item.module').then(m => m.ItemModule)
  },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
