import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';

import { ButtonComponent } from './button/button.component';
import { SectionComponent } from './section/section.component';
import { DataListComponent } from './data-list/data-list.component';
import { IoiTabComponent } from './ioi-tab/ioi-tab.component';
import { PageNavigatorComponent } from './page-navigator/page-navigator.component';
import { SkillProgressComponent } from './skill-progress/skill-progress.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { StateWidgetComponent } from './state-widget/state-widget.component';

@NgModule({
  declarations: [
    ButtonComponent,
    SectionComponent,
    DataListComponent,
    IoiTabComponent,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule
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
    StateWidgetComponent
  ]
})
export class BasicComponentModule { }
