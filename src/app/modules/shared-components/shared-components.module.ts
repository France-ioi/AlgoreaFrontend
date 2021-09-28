import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { SliderModule } from 'primeng/slider';
import { ListboxModule } from 'primeng/listbox';
import { MessagesModule } from 'primeng/messages';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';


import { ClickOutsideModule } from 'ng-click-outside';

import { ButtonComponent } from './components/button/button.component';
import { SectionComponent } from './components/section/section.component';
import { PageNavigatorComponent } from './components/page-navigator/page-navigator.component';
import { SkillProgressComponent } from './components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from './components/score-ring/score-ring.component';
import { StateWidgetComponent } from './components/state-widget/state-widget.component';
import { SwitchComponent } from './components/switch/switch.component';
import { GridComponent } from './components/grid/grid.component';
import { SelectionComponent } from './components/selection/selection.component';
import { CodeTokenComponent } from './components/code-token/code-token.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { TextareaComponent } from './components/textarea/textarea.component';
import { EditorBarComponent } from './components/editor-bar/editor-bar.component';
import { InputComponent } from './components/input/input.component';
import { SelectComponent } from './components/select/select.component';
import { SectionParagraphComponent } from './components/section-paragrah/section-paragraph.component';
import { MessageComponent } from './components/message/message.component';
import { ProgressLevelComponent } from './components/progress-level/progress-level.component';
import { FormErrorComponent } from './components/form-error/form-error.component';
import { RawItemLinkPipe } from 'src/app/shared/pipes/rawItemLink';
import { GroupLinkPipe } from 'src/app/shared/pipes/groupLink';
import { SubSectionComponent } from './components/sub-section/sub-section.component';
import { AddContentComponent } from './components/add-content/add-content.component';
import { FloatingSaveComponent } from './components/floating-save/floating-save.component';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSectionComponent } from './components/progress-section/progress-section.component';
import { BooleanSectionComponent } from './components/progress-section/boolean-section/boolean-section.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { DurationComponent } from './components/duration/duration.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { AccessCodeViewComponent } from './components/access-code-view/access-code-view.component';
import { LanguagePickerComponent } from '../../core/components/language-picker/language-picker.component';
import { UserCaptionPipe } from '../../shared/pipes/userCaption';
import { LogActionDisplayPipe } from '../../shared/pipes/logActionDisplay';
import { ErrorComponent } from './components/error/error.component';
import { LoadingComponent } from './components/loading/loading.component';
import { SmallSectionComponent } from './components/small-section/small-section.component';

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
    CodeTokenComponent,
    TimePickerComponent,
    TextareaComponent,
    EditorBarComponent,
    InputComponent,
    SelectComponent,
    SectionParagraphComponent,
    MessageComponent,
    ProgressLevelComponent,
    FormErrorComponent,
    RawItemLinkPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    SubSectionComponent,
    AddContentComponent,
    FloatingSaveComponent,
    ProgressSectionComponent,
    BooleanSectionComponent,
    DropdownComponent,
    DurationComponent,
    AccessCodeViewComponent,
    LanguagePickerComponent,
    ErrorComponent,
    LoadingComponent,
    SmallSectionComponent,
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
    SliderModule,
    ListboxModule,
    MessagesModule,
    TabViewModule,
    ProgressSpinnerModule,
    ToastModule,

    ClickOutsideModule,
    ReactiveFormsModule,
    TooltipModule,
    TooltipModule,
    InputNumberModule,
    InputMaskModule,
  ],
  exports: [
    ButtonComponent,
    SectionComponent,
    PageNavigatorComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    StateWidgetComponent,
    SwitchComponent,
    GridComponent,
    SelectionComponent,
    CodeTokenComponent,
    TimePickerComponent,
    TextareaComponent,
    EditorBarComponent,
    InputComponent,
    SelectComponent,
    SectionParagraphComponent,
    ToastModule,
    TableModule,
    TabViewModule,
    MessageComponent,
    ProgressLevelComponent,
    FormErrorComponent,
    RawItemLinkPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    SubSectionComponent,
    AddContentComponent,
    FloatingSaveComponent,
    ProgressSectionComponent,
    BooleanSectionComponent,
    DropdownComponent,
    DurationComponent,
    AccessCodeViewComponent,
    LanguagePickerComponent,
    ErrorComponent,
    LoadingComponent,
    SmallSectionComponent,
  ],
  providers: [],
  entryComponents: [
  ]
})
export class SharedComponentsModule { }
