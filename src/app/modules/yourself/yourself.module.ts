import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YourselfComponent } from './pages/yourself/yourself.component';
import { YourselfRoutingModule } from './yourself-routing.module';



@NgModule({
  declarations: [
    YourselfComponent,
  ],
  imports: [
    CommonModule,
    YourselfRoutingModule,
  ]
})
export class YourselfModule { }
