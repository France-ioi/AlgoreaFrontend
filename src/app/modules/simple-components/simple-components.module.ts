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

import { ButtonComponent } from './components/button/button.component';
import { SectionComponent } from './components/section/section.component';
import { PageNavigatorComponent } from './components/page-navigator/page-navigator.component';
import { SkillProgressComponent } from './components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from './components/score-ring/score-ring.component';
import { StateWidgetComponent } from './components/state-widget/state-widget.component';
import { SwitchComponent } from './components/switch/switch.component';
import { GridComponent } from './components/grid/grid.component';
import { SelectionComponent } from './components/selection/selection.component';
import { SubSectionComponent } from './components/sub-section/sub-section.component';
import { CodeTokenComponent } from './components/code-token/code-token.component';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { TextareaComponent } from './components/textarea/textarea.component';
import { SubGridComponent } from './components/sub-grid/sub-grid.component';
import { HeaderSectionComponent } from './components/header-section/header-section.component';
import { EditorBarComponent } from './components/editor-bar/editor-bar.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { InputComponent } from './components/input/input.component';
import { SelectionTreeComponent } from './components/selection-tree/selection-tree.component';
import { GroupNavigationTreeComponent } from './components/group-navigation-tree/group-navigation-tree.component';
import { ItemsNavigationTreeComponent } from './components/items-navigation-tree/items-navigation-tree.component';
import { GridGearComponent } from './components/grid-gear/grid-gear.component';
import { SelectComponent } from './components/select/select.component';
import { SliderComponent } from './components/slider/slider.component';
import { GridFilterComponent } from './components/grid/grid-filter/grid-filter.component';
import { GridFilterBarComponent } from './components/grid/grid-filter-bar/grid-filter-bar.component';
import { DatePickerSimpleComponent } from './components/date-picker-simple/date-picker-simple.component';
import { ListboxComponent } from './components/listbox/listbox.component';
import { SectionParagraphComponent } from './components/section-paragrah/section-paragraph.component';

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
export class SimpleComponentsModule { }
