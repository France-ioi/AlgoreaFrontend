import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LTIComponent } from './pages/lti/lti.component';



@NgModule({
  declarations: [
  ],
  imports: [ RouterModule.forChild([
    {
      path: '',
      pathMatch: 'full',
      component: LTIComponent,
    },
  ]) ],
  exports: [
    RouterModule,
  ],
})
export class LTIRoutingModule { }
