import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveComponentModule } from '@ngrx/component';
import { ItemRoutingModule } from './item-routing.module';
import { SharedComponentsModule } from '../shared-components/shared-components.module';
import { ItemHeaderComponent } from './components/item-header/item-header.component';
import { ItemByIdComponent } from './pages/item-by-id/item-by-id.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ItemContentComponent } from './pages/item-content/item-content.component';
import { ChapterChildrenComponent } from './components/chapter-children/chapter-children.component';
import { ItemProgressComponent } from './pages/item-progress/item-progress.component';
import { ItemLogViewComponent } from './pages/item-log-view/item-log-view.component';
import { SubSkillsComponent } from './components/sub-skills/sub-skills.component';
import { ParentSkillsComponent } from './components/parent-skills/parent-skills.component';
import { ItemEditContentComponent } from './pages/item-edit-content/item-edit-content.component';
import { ItemChildrenEditComponent } from './components/item-children-edit/item-children-edit.component';
import { TooltipModule } from 'primeng/tooltip';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { DurationToReadable } from 'src/app/shared/pipes/duration';
import { ButtonModule } from 'primeng/button';
import { PermissionsEditDialogComponent } from './components/permissions-edit-dialog/permissions-edit-dialog.component';
import { DialogModule } from 'primeng/dialog';
import { AddItemComponent } from './components/add-item/add-item.component';
import { CompositionFilterComponent } from './components/composition-filter/composition-filter.component';
import { UserProgressComponent } from './components/user-progress/user-progress.component';
import { ChapterGroupProgressComponent } from './pages/chapter-group-progress/chapter-group-progress.component';
import { GroupProgressGridComponent } from './pages/group-progress-grid/group-progress-grid.component';
import { ItemEditAdvancedParametersComponent } from './pages/item-edit-advanced-parameters/item-edit-advanced-parameters.component';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ChapterUserProgressComponent } from './pages/chapter-user-progress/chapter-user-progress.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { UserProgressDetailsComponent } from './components/user-progress-details/user-progress-details.component';
import { PropagationEditMenuComponent } from './components/propagation-edit-menu/propagation-edit-menu.component';
import { ItemDisplayComponent } from './pages/item-display/item-display.component';
import { ItemRemoveButtonComponent } from './components/item-remove-button/item-remove-button.component';
import { BeforeUnloadGuard } from 'src/app/shared/guards/before-unload-guard';
import { AnswerAuthorIndicatorComponent } from './components/answer-author-indicator/answer-author-indicator.component';
import { ItemPermissionsComponent } from './components/item-permissions/item-permissions.component';
import { TaskLoaderComponent } from './components/task-loader/task-loader.component';
import { ItemChildrenEditFormComponent } from './components/item-children-edit-form/item-children-edit-form.component';
import { ThreadComponent } from './components/thread/thread.component';
import { ItemDependenciesComponent } from './components/item-dependencies/item-dependencies.component';
import { ItemEditWrapperComponent } from './components/item-edit-wrapper/item-edit-wrapper.component';
import { AddDependencyComponent } from './components/add-dependency/add-dependency.component';
import {
  PermissionsEditFormComponent
} from './components/permissions-edit-dialog-form/permissions-edit-form.component';
import { ItemUnlockAccessComponent } from './components/item-unlock-access/item-unlock-access.component';
import { ItemTaskEditComponent } from './pages/item-task-edit/item-task-edit.component';
import { ThreadContainerComponent } from './components/thread-container/thread-container.component';
import { ThreadMessageComponent } from './components/thread-message/thread-message.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ItemChildrenEditListComponent } from './components/item-children-edit-list/item-children-edit-list.component';

@NgModule({
  declarations: [
    ItemByIdComponent,
    ItemHeaderComponent,
    ItemContentComponent,
    ChapterChildrenComponent,
    ItemProgressComponent,
    ItemLogViewComponent,
    SubSkillsComponent,
    ParentSkillsComponent,
    ItemEditContentComponent,
    ItemChildrenEditComponent,
    ItemProgressComponent,
    ChapterGroupProgressComponent,
    GroupProgressGridComponent,
    CompositionFilterComponent,
    UserProgressComponent,
    DurationToReadable,
    PermissionsEditDialogComponent,
    PermissionsEditFormComponent,
    AddItemComponent,
    ItemEditAdvancedParametersComponent,
    ChapterUserProgressComponent,
    UserProgressDetailsComponent,
    PropagationEditMenuComponent,
    ItemDisplayComponent,
    ItemRemoveButtonComponent,
    AnswerAuthorIndicatorComponent,
    ItemPermissionsComponent,
    TaskLoaderComponent,
    ItemChildrenEditFormComponent,
    ThreadComponent,
    ThreadContainerComponent,
    ThreadMessageComponent,
    ItemDependenciesComponent,
    ItemEditWrapperComponent,
    AddDependencyComponent,
    ItemUnlockAccessComponent,
    ItemTaskEditComponent,
    ItemChildrenEditListComponent,
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    ReactiveComponentModule,
    FormsModule,
    TooltipModule,
    DialogModule,
    ButtonModule,
    CalendarModule,
    InputNumberModule,
    OverlayPanelModule,
    InputTextareaModule,
  ],
  exports: [],
  providers: [
    PendingChangesGuard,
    BeforeUnloadGuard,
  ]
})
export class ItemModule { }
