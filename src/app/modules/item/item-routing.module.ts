import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ItemDetailsComponent } from './pages/item-details/item-details.component';

const routes: Routes = [
  {
    path: 'details/:path',
    component: ItemDetailsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemRoutingModule {}
