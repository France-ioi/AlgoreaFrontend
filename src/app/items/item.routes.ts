import { Routes } from '@angular/router';
import { ItemByIdComponent } from './item-by-id.component';
import { PendingChangesGuard } from 'src/app/guards/pending-changes-guard';
import { BeforeUnloadGuard } from 'src/app/guards/before-unload-guard';

const routes: Routes = [
  {
    path: ':idOrAlias',
    component: ItemByIdComponent,
    canDeactivate: [ BeforeUnloadGuard, PendingChangesGuard ],
    // Children below do not use routing but there are defined here so that the router can validate the route exists
    children: [
      { path: '', pathMatch: 'full', children: [] },
      {
        path: 'edit-children',
        canDeactivate: [ PendingChangesGuard ],
        children: [],
      },
      {
        path: 'parameters',
        canDeactivate: [ PendingChangesGuard ],
        children: [],
      },
      {
        path: 'edit',
        children: []
      },
      {
        path: 'progress',
        children: [
          {
            path: '',
            redirectTo: 'history',
            pathMatch: 'full',
          },
          {
            path: 'history',
            children: [],
          },
          {
            path: 'chapter',
            children: [],
          },
          {
            path: 'chapter-user-progress',
            redirectTo: 'chapter',
            pathMatch: 'full',
          }
        ]
      },
      {
        path: 'dependencies',
        children: [],
      },
      {
        path: 'forum',
        children: [
          {
            path: '',
            redirectTo: 'my-threads',
            pathMatch: 'full',
          },
          {
            path: 'my-threads',
            children: [],
          },
          {
            path: 'others',
            children: [],
          },
          {
            path: 'group',
            children: [],
          },
        ],
      },
    ]
  }
];

export default routes;
