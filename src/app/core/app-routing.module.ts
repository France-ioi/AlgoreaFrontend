import { NgModule } from '@angular/core';
import { Routes, RouterModule, UrlSegment } from '@angular/router';
import { urlStringFromArray } from '../shared/helpers/url';
import { activityPrefix, appDefaultItemRoute, skillPrefix, urlArrayForItemRoute } from '../shared/routing/item-route';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { RedirectToIdComponent } from './pages/redirect-to-id/redirect-to-id.component';
import { DefaultLayoutInitService } from '../shared/services/layout.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: urlStringFromArray(urlArrayForItemRoute(appDefaultItemRoute)),
    pathMatch: 'full',
  },
  {
    path: 'groups',
    loadChildren: (): Promise<any> => import('../modules/group/group.module').then(m => m.GroupModule),
    canActivate: [ DefaultLayoutInitService ]
  },
  {
    path: activityPrefix,
    loadChildren: (): Promise<any> => import('../modules/item/item.module').then(m => m.ItemModule),
    canActivate: [ DefaultLayoutInitService ]
  },
  {
    path: skillPrefix,
    loadChildren: (): Promise<any> => import('../modules/item/item.module').then(m => m.ItemModule),
    canActivate: [ DefaultLayoutInitService ]
  },
  {
    path: 'lti/:contentId',
    loadChildren: () => import('../modules/lti/lti.routes'),
  },
  {
    // "r/**" -> the parameter may contain slashes
    matcher: url => (url[0]?.path === 'r' ? {
      consumed: url,
      posParams: { path: new UrlSegment(url.slice(1).map(s => s.path).join('/'), {}) },
    } : null) ,
    component: RedirectToIdComponent,
    canActivate: [ DefaultLayoutInitService ]
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    canActivate: [ DefaultLayoutInitService ]
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
