import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BeforeUnloadGuard } from 'src/app/shared/guards/before-unload-guard';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { ItemByIdComponent } from './pages/item-by-id/item-by-id.component';

@NgModule({
  imports: [ RouterModule.forChild([
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
              children: [],
            }
          ]
        },
        {
          path: 'dependencies',
          children: [],
        },
      ]
    }
  ]) ],
  exports: [ RouterModule ],
})
export class ItemRoutingModule {}
