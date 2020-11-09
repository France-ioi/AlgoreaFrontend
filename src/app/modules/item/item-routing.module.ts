import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemByIdComponent } from './pages/item-by-id/item-by-id.component';
import { ItemDetailsComponent } from './pages/item-details/item-details.component';
import { ItemEditComponent } from './pages/item-edit/item-edit.component';
import { ItemContentComponent } from './pages/item-content/item-content.component';
import { ItemProgressComponent } from './pages/item-progress/item-progress.component';
import { ItemCurrentSituationComponent } from './pages/item-current-situation/item-current-situation.component';
import { ItemLogViewComponent } from './pages/item-log-view/item-log-view.component';
import { ItemEditContentComponent } from './pages/item-edit-content/item-edit-content.component';

@NgModule({
  imports: [ RouterModule.forChild([
    {
      path: 'by-id/:id',
      component: ItemByIdComponent,
      children: [
        {
          path: 'details',
          component: ItemDetailsComponent,
          children: [
            {
              path: '',
              component: ItemContentComponent,
            },
            {
              path: 'progress',
              component: ItemProgressComponent,
              children: [
                {
                  path: '',
                  component: ItemCurrentSituationComponent,
                  children: [
                    {
                      path: '',
                      component: ItemLogViewComponent
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          path: 'edit',
          component: ItemEditComponent,
          children: [
            {
              path: '',
              component: ItemEditContentComponent
            }
          ]
        },
      ]
    }
  ]) ],
  exports: [ RouterModule ],
})
export class ItemRoutingModule {}
