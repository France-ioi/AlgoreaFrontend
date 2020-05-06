import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './group.component';
import { GroupHeaderComponent } from './group-header/group-header.component';
import { CoreModule } from 'core';


@NgModule({
  declarations: [GroupComponent, GroupHeaderComponent],
  imports: [
    CommonModule,
    GroupRoutingModule,
    CoreModule
  ]
})
export class GroupModule { }
