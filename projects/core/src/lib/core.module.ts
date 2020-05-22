import { NgModule } from '@angular/core';
import { CoreComponent } from './core.component';
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
import {
  MatDialogModule,
  MAT_DIALOG_DEFAULT_OPTIONS,
} from '@angular/material/dialog';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';

import { ClickOutsideModule } from 'ng-click-outside';
import { NgDragDropModule } from 'ng-drag-drop';

import { ButtonComponent } from './button/button.component';
import { SectionComponent } from './section/section.component';
import { DataListComponent } from './data-list/data-list.component';
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
import { SelectionTreeComponent } from './selection-tree/selection-tree.component';
import { GroupNavigationTreeComponent } from './group-navigation-tree/group-navigation-tree.component';
import { ItemsNavigationTreeComponent } from './items-navigation-tree/items-navigation-tree.component';
import { MatDialogComponent } from './mat-dialog/mat-dialog.component';
import { LogViewGridComponent } from './log-view-grid/log-view-grid.component';
import { GridGearComponent } from './grid-gear/grid-gear.component';
import { MatMenuModule } from '@angular/material';
import { CategoryDropdownComponent } from './category-dropdown/category-dropdown.component';
import { NotificationComponent } from './notification/notification.component';
import { SelectComponent } from './select/select.component';
import { SliderComponent } from './slider/slider.component';
import { GridFilterComponent } from './grid/grid-filter/grid-filter.component';
import { GridFilterBarComponent } from './grid/grid-filter-bar/grid-filter-bar.component';
import { DatePickerSimpleComponent } from './date-picker-simple/date-picker-simple.component';
import { ListboxComponent } from './listbox/listbox.component';
import { SectionParagraphComponent } from './section-paragrah/section-paragraph.component';
import { PickListComponent } from './pick-list/pick-list.component';
import { DateTimePickerComponent } from './date-picker/date-time-picker/date-time-picker.component';
import { EditUserDialogComponent } from './dialogs/edit-user-dialog/edit-user-dialog.component';
import { AttachGroupDialogComponent } from './dialogs/attach-group-dialog/attach-group-dialog.component';
import { ResetPasswordDialogComponent } from './dialogs/reset-password-dialog/reset-password-dialog.component';
import { ConfirmPasswordDialogComponent } from './dialogs/confirm-password-dialog/confirm-password-dialog.component';
import { MessageComponent } from './message/message.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';
import { DragDropDirective } from './image-upload/drag-drop.directive';
import { ActivitySkillListComponent } from './activity-skill-list/activity-skill-list.component';
import { GenerateBatchUserDialogComponent } from './dialogs/generate-batch-user-dialog/generate-batch-user-dialog.component';
import { JoinGroupDialogComponent } from './dialogs/join-group-dialog/join-group-dialog.component';
import { SearchInputComponent } from './search-input/search-input.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { ProgressLevelComponent } from './progress-level/progress-level.component';
import { AccessEditDialogComponent } from './dialogs/access-edit-dialog/access-edit-dialog.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { SkillActivityTabsComponent } from './skill-activity-tabs/skill-activity-tabs.component';
import { SearchTabComponent } from './search-tab/search-tab.component';

@NgModule({
  declarations: [
    CoreComponent,
    BreadcrumbComponent,
    ButtonComponent,
    SectionComponent,
    DataListComponent,
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
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    MatDialogComponent,
    LogViewGridComponent,
    GridGearComponent,
    CategoryDropdownComponent,
    NotificationComponent,
    SelectComponent,
    SliderComponent,
    GridFilterComponent,
    GridFilterBarComponent,
    DatePickerSimpleComponent,
    ListboxComponent,
    SectionParagraphComponent,
    PickListComponent,
    DateTimePickerComponent,
    EditUserDialogComponent,
    AttachGroupDialogComponent,
    ResetPasswordDialogComponent,
    ConfirmPasswordDialogComponent,
    MessageComponent,
    ImageUploadComponent,
    DragDropDirective,
    ActivitySkillListComponent,
    GenerateBatchUserDialogComponent,
    JoinGroupDialogComponent,
    SearchInputComponent,
    SearchFilterComponent,
    ProgressLevelComponent,
    AccessEditDialogComponent,
    ProgressSectionComponent,
    SkillActivityTabsComponent,
    SearchTabComponent,
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
    BreadcrumbComponent,
    ButtonComponent,
    SectionComponent,
    DataListComponent,
    MatTabsModule,
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
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    MatDialogComponent,
    LogViewGridComponent,
    GridGearComponent,
    CategoryDropdownComponent,
    NotificationComponent,
    SelectComponent,
    SliderComponent,
    GridFilterComponent,
    GridFilterBarComponent,
    DatePickerSimpleComponent,
    ListboxComponent,
    SectionParagraphComponent,
    PickListComponent,
    DateTimePickerComponent,
    EditUserDialogComponent,
    AttachGroupDialogComponent,
    ResetPasswordDialogComponent,
    ConfirmPasswordDialogComponent,
    MessageComponent,
    ImageUploadComponent,
    ActivitySkillListComponent,
    GenerateBatchUserDialogComponent,
    JoinGroupDialogComponent,
    SearchInputComponent,
    SearchFilterComponent,
    ProgressLevelComponent,
    AccessEditDialogComponent,
    SkillActivityTabsComponent,
    SearchTabComponent,
    TableModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
  ],
  entryComponents: [
    MatDialogComponent,
    ActivityPickerComponent,
    EditUserDialogComponent,
    AttachGroupDialogComponent,
    ResetPasswordDialogComponent,
    ConfirmPasswordDialogComponent,
    GenerateBatchUserDialogComponent,
    JoinGroupDialogComponent,
    AccessEditDialogComponent,
  ],
})
export class CoreModule {}
