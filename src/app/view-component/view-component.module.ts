import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { TableModule } from 'primeng/table';
import { BasicComponentModule } from '../basic-component/basic-component.module';
import { TieredMenuModule } from 'primeng/tieredmenu';

import { TaskTabComponent } from './task-tab/task-tab.component';
import { TaskComponent } from './task/task.component';
import { TaskHeaderComponent } from './task-header/task-header.component';
import { YourselfComponent } from './yourself/yourself.component';
import { YourselfTabComponent } from './yourself-tab/yourself-tab.component';
import { YourselfHeaderComponent } from './yourself-header/yourself-header.component';
import { GroupComponent } from './group/group.component';
import { GroupHeaderComponent } from './group-header/group-header.component';
import { GroupTabComponent } from './group-tab/group-tab.component';
import { MatMenu, MatMenuModule } from '@angular/material';


@NgModule({
  declarations: [
    TaskTabComponent,
    TaskHeaderComponent,
    TaskComponent,
    YourselfComponent,
    YourselfTabComponent,
    YourselfHeaderComponent,
    GroupComponent,
    GroupHeaderComponent,
    GroupTabComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    TableModule,
    BasicComponentModule,
    TieredMenuModule,
    MatMenuModule
  ],
  exports: [
    TaskTabComponent,
    TaskHeaderComponent,
    TaskComponent,
    YourselfComponent,
    YourselfTabComponent,
    YourselfHeaderComponent,
    GroupComponent,
    GroupHeaderComponent,
    GroupTabComponent
  ]
})
export class ViewComponentModule { }
