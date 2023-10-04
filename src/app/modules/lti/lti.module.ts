import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LTIComponent } from './pages/lti/lti.component';
import { LTIRoutingModule } from './lti-routing.module';

@NgModule({
  imports: [
    CommonModule,
    LTIRoutingModule,
    LTIComponent,
  ],
})
export class LTIModule { }
