import { Routes, UrlSegment } from '@angular/router';
import { PendingChangesGuard } from 'src/app/guards/pending-changes-guard';
import { BeforeUnloadGuard } from 'src/app/guards/before-unload-guard';
import { GroupDeleteService } from './groups/data-access/group-delete.service';
import { DefaultLayoutInitService } from './services/layout.service';
import { urlStringFromArray } from './utils/url';
import { activityPrefix, appDefaultActivityRoute, skillPrefix, urlArrayForItemRoute } from './models/routing/item-route';
import { RedirectToIdComponent } from './containers/redirect-to-id/redirect-to-id.component';
import { PageNotFoundComponent } from './containers/page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: urlStringFromArray(urlArrayForItemRoute(appDefaultActivityRoute)),
    pathMatch: 'full',
  },
  {
    path: 'groups',
    loadChildren: () => import('./groups/group.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, GroupDeleteService ],
  },
  {
    path: activityPrefix,
    loadChildren: () => import('./items/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
  },
  {
    path: skillPrefix,
    loadChildren: () => import('./items/item.routes'),
    canActivate: [ DefaultLayoutInitService ],
    providers: [ PendingChangesGuard, BeforeUnloadGuard ],
  },
  {
    path: 'lti/:contentId',
    loadChildren: () => import('./lti/lti.routes'),
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
