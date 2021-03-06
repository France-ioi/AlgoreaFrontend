import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { ItemByIdComponent } from './pages/item-by-id/item-by-id.component';
import { ItemDetailsComponent } from './pages/item-details/item-details.component';
import { ItemEditComponent } from './pages/item-edit/item-edit.component';

@NgModule({
  imports: [ RouterModule.forChild([
    {
      path: 'by-id/:id',
      component: ItemByIdComponent,
      children: [
        { path: '', redirectTo: 'details', pathMatch: 'full' },
        {
          path: 'details',
          component: ItemDetailsComponent,
          // Children below do not use routing but there are defined here so that the router can validate the route exists
          children: [
            { path: '', pathMatch: 'full', },
            {
              path: 'progress',
              children: [
                {
                  path: '',
                  redirectTo: 'history',
                  pathMatch: 'full'
                },
                {
                  path: 'history',
                },
                {
                  path: 'chapter',
                },
                {
                  path: 'chapter-user-progress',
                }
              ]
            }
          ]
        },
        {
          path: 'edit',
          component: ItemEditComponent,
          canDeactivate: [ PendingChangesGuard ],
          children: [
            { path: '', pathMatch: 'full' },
            { path: 'advanced-parameters' }
          ]
        },
      ]
    }
  ]) ],
  exports: [ RouterModule ],
})
export class ItemRoutingModule {}
