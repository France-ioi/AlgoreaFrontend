import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LTIComponent } from './pages/lti/lti.component';
import { LTIRoutingModule } from './lti-routing.module';
import { SharedComponentsModule } from '../shared-components/shared-components.module';



@NgModule({
  declarations: [
    LTIComponent,
  ],
  imports: [
    CommonModule,
    SharedComponentsModule,
    LTIRoutingModule,
  ],
})
export class LTIModule { }
