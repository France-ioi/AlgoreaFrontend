import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';

import { ButtonComponent } from './button/button.component';
import { SectionComponent } from './section/section.component';
import { DataListComponent } from './data-list/data-list.component';
import { IoiTabComponent } from './ioi-tab/ioi-tab.component';
import { PageNavigatorComponent } from './page-navigator/page-navigator.component';
import { SkillProgressComponent } from './skill-progress/skill-progress.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { StateWidgetComponent } from './state-widget/state-widget.component';
import { SwitchComponent } from './switch/switch.component';
import { GridComponent } from './grid/grid.component';

@NgModule({
  declarations: [
    ButtonComponent,
    SectionComponent,
    DataListComponent,
    IoiTabComponent,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent,
    SwitchComponent,
    GridComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    InputSwitchModule
  ],
  exports: [
    ButtonComponent,
    SectionComponent,
    DataListComponent,
    MatTabsModule,
    IoiTabComponent,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent,
    SwitchComponent,
    GridComponent
  ]
})
export class BasicComponentModule { }
