import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TreeModule } from 'primeng/tree';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { ListboxModule } from 'primeng/listbox';
import { MessagesModule } from 'primeng/messages';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

import { ClickOutsideModule } from 'ng-click-outside';
import { NgDragDropModule } from 'ng-drag-drop';

import { ButtonComponent } from './button/button.component';
import { SectionComponent } from './section/section.component';
import { PageNavigatorComponent } from './page-navigator/page-navigator.component';
import { SkillProgressComponent } from './skill-progress/skill-progress.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { StateWidgetComponent } from './state-widget/state-widget.component';
import { SwitchComponent } from './switch/switch.component';
import { GridComponent } from './grid/grid.component';
import { SelectionComponent } from './selection/selection.component';
import { SubSectionComponent } from './sub-section/sub-section.component';
import { CodeTokenComponent } from './code-token/code-token.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { TimePickerComponent } from './time-picker/time-picker.component';
import { TextareaComponent } from './textarea/textarea.component';
import { SubGridComponent } from './sub-grid/sub-grid.component';
import { HeaderSectionComponent } from './header-section/header-section.component';
import { EditorBarComponent } from './editor-bar/editor-bar.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { InputComponent } from './input/input.component';
import { SelectionTreeComponent } from './selection-tree/selection-tree.component';
import { GroupNavigationTreeComponent } from './group-navigation-tree/group-navigation-tree.component';
import { ItemsNavigationTreeComponent } from './items-navigation-tree/items-navigation-tree.component';
import { GridGearComponent } from './grid-gear/grid-gear.component';
import { SelectComponent } from './select/select.component';
import { SliderComponent } from './slider/slider.component';
import { GridFilterComponent } from './grid/grid-filter/grid-filter.component';
import { GridFilterBarComponent } from './grid/grid-filter-bar/grid-filter-bar.component';
import { DatePickerSimpleComponent } from './date-picker-simple/date-picker-simple.component';
import { ListboxComponent } from './listbox/listbox.component';
import { SectionParagraphComponent } from './section-paragrah/section-paragraph.component';

@NgModule({
  declarations: [
    ButtonComponent,
    SectionComponent,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent,
    SwitchComponent,
    GridComponent,
    SelectionComponent,
    SubSectionComponent,
    CodeTokenComponent,
    DatePickerComponent,
    TimePickerComponent,
    TextareaComponent,
    SubGridComponent,
    HeaderSectionComponent,
    EditorBarComponent,
    DropdownComponent,
    InputComponent,
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    GridGearComponent,
    SelectComponent,
    SliderComponent,
    GridFilterComponent,
    GridFilterBarComponent,
    DatePickerSimpleComponent,
    ListboxComponent,
    SectionParagraphComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    BreadcrumbModule,
    ButtonModule,
    InputSwitchModule,
    CalendarModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    TreeModule,
    TieredMenuModule,
    TooltipModule,
    SliderModule,
    ListboxModule,
    MessagesModule,
    TabViewModule,
    ProgressSpinnerModule,
    ToastModule,

    MatIconModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTabsModule,
    MatDialogModule,
    MatMenuModule,

    NgDragDropModule.forRoot(),
    ClickOutsideModule,
  ],
  exports: [
    ButtonComponent,
    SectionComponent,
    MatTabsModule,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent,
    SwitchComponent,
    GridComponent,
    SelectionComponent,
    SubSectionComponent,
    CodeTokenComponent,
    DatePickerComponent,
    TimePickerComponent,
    TextareaComponent,
    SubGridComponent,
    HeaderSectionComponent,
    EditorBarComponent,
    DropdownComponent,
    InputComponent,
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    GridGearComponent,
    SelectComponent,
    SliderComponent,
    GridFilterComponent,
    GridFilterBarComponent,
    DatePickerSimpleComponent,
    ListboxComponent,
    SectionParagraphComponent,
    ProgressSpinnerModule,
    ToastModule,
    TableModule,
    TabViewModule,
  ],
  providers: [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}}
  ],
  entryComponents: [
  ]
})
export class BasicComponentModule { }
