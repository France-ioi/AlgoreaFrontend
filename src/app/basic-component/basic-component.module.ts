import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TreeModule } from 'primeng/tree';
import { TieredMenuModule } from 'primeng/tieredmenu';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
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
import { HeaderSectionComponent } from './header-section/header-section.component';
import { EditorBarComponent } from './editor-bar/editor-bar.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { ChapterGridComponent } from './chapter-grid/chapter-grid.component';
import { InputComponent } from './input/input.component';
import { DialogComponent } from './dialog/dialog.component';
import { SelectionTreeComponent } from './selection-tree/selection-tree.component';
import { GroupNavigationTreeComponent } from './group-navigation-tree/group-navigation.component';
import { ItemsNavigationTreeComponent } from './items-navigation-tree/items-navigation-tree.component';
import { MatDialogComponent } from './mat-dialog/mat-dialog.component';
import { LogViewGridComponent } from './log-view-grid/log-view-grid.component';

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
    SubGridComponent,
    HeaderSectionComponent,
    EditorBarComponent,
    DropdownComponent,
    ChapterGridComponent,
    InputComponent,
    DialogComponent,
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    MatDialogComponent,
    LogViewGridComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputSwitchModule,
    CalendarModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    TreeModule,
    TieredMenuModule,

    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    MatDialogModule
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
    SubGridComponent,
    HeaderSectionComponent,
    EditorBarComponent,
    DropdownComponent,
    ChapterGridComponent,
    InputComponent,
    DialogComponent,
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    MatDialogComponent,
    LogViewGridComponent
  ],
  providers: [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}
  ],
  entryComponents: [
    MatDialogComponent,
    ActivityPickerComponent
  ]
})
export class BasicComponentModule { }
