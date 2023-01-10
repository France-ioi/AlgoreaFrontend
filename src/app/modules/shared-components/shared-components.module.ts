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
import { TagModule } from 'primeng/tag';


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
import { ProgressSelectComponent } from './components/collapsible-section/progress-select/progress-select.component';
import { SwitchFieldComponent } from './components/collapsible-section/switch-field/switch-field.component';
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
import { CollapsibleSectionComponent } from './components/collapsible-section/collapsible-section.component';
import { NeighborWidgetComponent } from './components/neighbor-widget/neighbor-widget.component';
import { GroupPermissionCaptionPipe } from '../../shared/pipes/groupPermissionCaption';
import { FullHeightContentDirective } from '../../shared/directives/full-height-content.directive';
import { SectionHeaderComponent } from './components/section-header/section-header.component';
import { PathSuggestionComponent } from './components/path-suggestion/path-suggestion.component';
import {
  AllowsViewingItemContentPipe,
  AllowsViewingItemInfoPipe,
} from 'src/app/shared/models/domain/item-view-permission';
import { AllowsGrantingContentViewItemPipe, AllowsGrantingViewItemPipe } from 'src/app/shared/models/domain/item-grant-view-permission';
import { AllowsEditingAllItemPipe, AllowsEditingChildrenItemPipe } from 'src/app/shared/models/domain/item-edit-permission';
import { AllowsWatchingItemResultsPipe } from 'src/app/shared/models/domain/item-watch-permission';
import { MessageInfoComponent } from './components/message-info/message-info.component';
import { HasHTMLDirective } from '../../shared/directives/has-html.directive';
import { ItemRouteLinkPipe } from 'src/app/shared/pipes/itemRouteLink';
import { AllowDisplayCode } from '../../shared/pipes/allowDisplayCode';

@NgModule({
  declarations: [
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
    SectionParagraphComponent,
    MessageComponent,
    ProgressLevelComponent,
    FormErrorComponent,
    RawItemLinkPipe,
    ItemRouteLinkPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    GroupPermissionCaptionPipe,
    SubSectionComponent,
    AddContentComponent,
    FloatingSaveComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    DropdownComponent,
    DurationComponent,
    AccessCodeViewComponent,
    LanguagePickerComponent,
    ErrorComponent,
    LoadingComponent,
    CollapsibleSectionComponent,
    NeighborWidgetComponent,
    FullHeightContentDirective,
    HasHTMLDirective,
    SectionHeaderComponent,
    PathSuggestionComponent,
    AllowsViewingItemContentPipe,
    AllowsViewingItemInfoPipe,
    AllowsGrantingViewItemPipe,
    AllowsGrantingContentViewItemPipe,
    AllowsEditingAllItemPipe,
    AllowsEditingChildrenItemPipe,
    AllowsWatchingItemResultsPipe,
    AllowDisplayCode,
    MessageInfoComponent,
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
    TagModule,

    ReactiveFormsModule,
    TooltipModule,
    TooltipModule,
    InputNumberModule,
    InputMaskModule,
  ],
  exports: [
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
    SectionParagraphComponent,
    ToastModule,
    TableModule,
    TabViewModule,
    MessageComponent,
    ProgressLevelComponent,
    FormErrorComponent,
    RawItemLinkPipe,
    ItemRouteLinkPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    LogActionDisplayPipe,
    GroupPermissionCaptionPipe,
    SubSectionComponent,
    AddContentComponent,
    FloatingSaveComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    DropdownComponent,
    DurationComponent,
    AccessCodeViewComponent,
    LanguagePickerComponent,
    ErrorComponent,
    LoadingComponent,
    CollapsibleSectionComponent,
    NeighborWidgetComponent,
    FullHeightContentDirective,
    HasHTMLDirective,
    SectionHeaderComponent,
    PathSuggestionComponent,
    AllowsViewingItemContentPipe,
    AllowsViewingItemInfoPipe,
    AllowsGrantingViewItemPipe,
    AllowsGrantingContentViewItemPipe,
    AllowsEditingAllItemPipe,
    AllowsEditingChildrenItemPipe,
    AllowsWatchingItemResultsPipe,
    MessageInfoComponent,
    AllowDisplayCode,
  ],
  providers: [],
})
export class SharedComponentsModule { }
