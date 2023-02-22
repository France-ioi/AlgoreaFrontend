import { NgModule } from '@angular/core';
import { Routes, RouterModule, UrlSegment } from '@angular/router';
import { urlStringFromArray } from '../shared/helpers/url';
import { appDefaultItemRoute, urlArrayForItemRoute } from '../shared/routing/item-route';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { RedirectToIdComponent } from './pages/redirect-to-id/redirect-to-id.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: urlStringFromArray(urlArrayForItemRoute(appDefaultItemRoute)),
    pathMatch: 'full',
  },
  {
    path: 'groups',
    loadChildren: (): Promise<any> => import('../modules/group/group.module').then(m => m.GroupModule)
  },
  {
    path: 'activities',
    loadChildren: (): Promise<any> => import('../modules/item/item.module').then(m => m.ItemModule)
  },
  {
    path: 'skills',
    loadChildren: (): Promise<any> => import('../modules/item/item.module').then(m => m.ItemModule)
  },
  {
    path: 'lti/:contentId',
    loadChildren: (): Promise<any> => import('../modules/lti/lti.module').then(m => m.LTIModule),
  },
  {
    // "r/**" -> the parameter may contain slashes
    matcher: url => (url[0]?.path === 'r' ? {
      consumed: url,
      posParams: { path: new UrlSegment(url.slice(1).map(s => s.path).join('/'), {}) },
    } : null) ,
    component: RedirectToIdComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
