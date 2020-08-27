import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemRoutingModule } from './item-routing.module';
import { SharedComponentsModule } from '../shared-components/shared-components.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ItemRoutingModule,
    SharedComponentsModule,
  ]
})
export class ItemModule { }
