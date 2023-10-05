import { NgModule } from '@angular/core';
import { Routes, RouterModule, UrlSegment } from '@angular/router';
import { urlStringFromArray } from '../shared/helpers/url';
import { activityPrefix, appDefaultItemRoute, skillPrefix, urlArrayForItemRoute } from '../shared/routing/item-route';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { RedirectToIdComponent } from './pages/redirect-to-id/redirect-to-id.component';
import { DefaultLayoutInitService } from '../shared/services/layout.service';
import { PendingChangesGuard } from '../shared/guards/pending-changes-guard';
import { BeforeUnloadGuard } from '../shared/guards/before-unload-guard';

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
    loadChildren: () => import('../modules/item/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
  },
  {
    path: skillPrefix,
    loadChildren: () => import('../modules/item/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
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
