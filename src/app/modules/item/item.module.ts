import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemRoutingModule } from './item-routing.module';
import { SharedComponentsModule } from '../shared-components/shared-components.module';
import { ItemDetailsComponent } from './pages/item-details/item-details.component';
import { ItemHeaderComponent } from './components/item-header/item-header.component';
import { ItemEditComponent } from './pages/item-edit/item-edit.component';
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
import { LogActionDisplayPipe } from './pages/item-log-view/logActionDisplay';
import { InputNumberModule } from 'primeng/inputnumber';
import { ChapterUserProgressComponent } from './pages/chapter-user-progress/chapter-user-progress.component';
import { ItemProgressLabelPipe } from './pages/item-progress/itemProgressLabel';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@NgModule({
  declarations: [
    ItemByIdComponent,
    ItemDetailsComponent,
    ItemHeaderComponent,
    ItemEditComponent,
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
    AddItemComponent,
    ItemEditAdvancedParametersComponent,
    LogActionDisplayPipe,
    ChapterUserProgressComponent,
    ItemProgressLabelPipe,
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    TooltipModule,
    DialogModule,
    ButtonModule,
    CalendarModule,
    InputNumberModule,
    OverlayPanelModule,
  ],
  exports: [],
  providers: [
    PendingChangesGuard,
  ]
})
export class ItemModule { }
