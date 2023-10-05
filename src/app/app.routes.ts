import { Routes, UrlSegment } from '@angular/router';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { BeforeUnloadGuard } from 'src/app/shared/guards/before-unload-guard';
import { GroupDeleteService } from './modules/group/services/group-delete.service';
import { DefaultLayoutInitService } from './shared/services/layout.service';
import { urlStringFromArray } from './shared/helpers/url';
import { activityPrefix, appDefaultItemRoute, skillPrefix, urlArrayForItemRoute } from './shared/routing/item-route';
import { RedirectToIdComponent } from './core/pages/redirect-to-id/redirect-to-id.component';
import { PageNotFoundComponent } from './core/pages/page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: urlStringFromArray(urlArrayForItemRoute(appDefaultItemRoute)),
    pathMatch: 'full',
  },
  {
    path: 'groups',
    loadChildren: () => import('./modules/group/group.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, GroupDeleteService ],
  },
  {
    path: activityPrefix,
    loadChildren: () => import('./modules/item/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
  },
  {
    path: skillPrefix,
    loadChildren: () => import('./modules/item/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
  },
  {
    path: 'lti/:contentId',
    loadChildren: () => import('./modules/lti/lti.routes'),
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

export default routes;
