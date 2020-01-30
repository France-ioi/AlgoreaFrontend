import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { TableModule } from 'primeng/table';
import { BasicComponentModule } from '../basic-component/basic-component.module';


import { TaskTabComponent } from './task-tab/task-tab.component';


@NgModule({
  declarations: [
    TaskTabComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    TableModule,
    BasicComponentModule,
  ],
  exports: [
    TaskTabComponent,
  ]
})
export class ViewComponentModule { }
