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
import { ItemCurrentSituationComponent } from './pages/item-current-situation/item-current-situation.component';
import { ItemLogViewComponent } from './pages/item-log-view/item-log-view.component';
import { SubSkillsComponent } from './components/sub-skills/sub-skills.component';
import { ParentSkillsComponent } from './components/parent-skills/parent-skills.component';
import { ItemEditContentComponent } from './pages/item-edit-content/item-edit-content.component';
import { ItemChildrenEditComponent } from './components/item-children-edit/item-children-edit.component';
import { TooltipModule } from 'primeng/tooltip';
import { PendingChangesGuard } from 'src/app/shared/guards/pending-changes-guard';
import { MatMenuModule } from '@angular/material/menu';
import { DurationToReadable } from 'src/app/shared/pipes/duration';
import { ButtonModule } from 'primeng/button';
import { PermissionsEditDialogComponent } from './components/permissions-edit-dialog/permissions-edit-dialog.component';
import { DialogModule } from 'primeng/dialog';
import { AccessCodeViewComponent } from './components/access-code-view/access-code-view.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { CompositionFilterComponent } from './components/composition-filter/composition-filter.component';
import { UserProgressComponent } from './components/user-progress/user-progress.component';
import { ItemChapterViewComponent } from './pages/item-chapter-view/item-chapter-view.component';
import { GroupProgressGridComponent } from './pages/group-progress-grid/group-progress-grid.component';
import { ItemEditAdvancedParametersComponent } from './pages/item-edit-advanced-parameters/item-edit-advanced-parameters.component';
import { CalendarModule } from 'primeng/calendar';
import { LogActionDisplayPipe } from './pages/item-log-view/logActionDisplay';
import { InputNumberModule } from 'primeng/inputnumber';

@NgModule({
  declarations: [
    ItemByIdComponent,
    ItemDetailsComponent,
    ItemHeaderComponent,
    ItemEditComponent,
    ItemContentComponent,
    ChapterChildrenComponent,
    ItemProgressComponent,
    ItemCurrentSituationComponent,
    ItemLogViewComponent,
    SubSkillsComponent,
    ParentSkillsComponent,
    ItemEditContentComponent,
    ItemChildrenEditComponent,
    ItemProgressComponent,
    ItemChapterViewComponent,
    GroupProgressGridComponent,
    CompositionFilterComponent,
    UserProgressComponent,
    DurationToReadable,
    PermissionsEditDialogComponent,
    AccessCodeViewComponent,
    AddItemComponent,
    ItemEditAdvancedParametersComponent,
    LogActionDisplayPipe,
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    TooltipModule,
    MatMenuModule,
    DialogModule,
    ButtonModule,
    CalendarModule,
    InputNumberModule,
  ],
  providers: [
    PendingChangesGuard,
  ]
})
export class ItemModule { }
