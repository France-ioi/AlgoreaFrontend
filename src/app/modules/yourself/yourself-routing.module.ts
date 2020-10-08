import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { YourselfComponent } from './pages/yourself/yourself.component';

const routes: Routes = [
  {
    path: '',
    component: YourselfComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class YourselfRoutingModule {}
