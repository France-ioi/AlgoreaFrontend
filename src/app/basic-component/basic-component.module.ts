import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
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
import { SwitchComponent } from './switch/switch.component';
import { GridComponent } from './grid/grid.component';
import { SelectionComponent } from './selection/selection.component';
import { SubSectionComponent } from './sub-section/sub-section.component';
import { SwitchContainerComponent } from './switch-container/switch-container.component';
import { GroupButtonComponent } from './group-button/group-button.component';
import { CodeTokenComponent } from './code-token/code-token.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { ActivityPickerComponent } from './activity-picker/activity-picker.component';
import { TimePickerComponent } from './time-picker/time-picker.component';
import { TextareaComponent } from './textarea/textarea.component';
import { SubGridComponent } from './sub-grid/sub-grid.component';

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
    GridComponent,
    SelectionComponent,
    SubSectionComponent,
    SwitchContainerComponent,
    GroupButtonComponent,
    CodeTokenComponent,
    DatePickerComponent,
    ActivityPickerComponent,
    TimePickerComponent,
    TextareaComponent,
    SubGridComponent
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
    InputSwitchModule,
    CalendarModule,
    InputTextareaModule
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
    GridComponent,
    SelectionComponent,
    SubSectionComponent,
    SwitchContainerComponent,
    GroupButtonComponent,
    CodeTokenComponent,
    DatePickerComponent,
    ActivityPickerComponent,
    TimePickerComponent,
    TextareaComponent,
    SubGridComponent
  ]
})
export class BasicComponentModule { }
