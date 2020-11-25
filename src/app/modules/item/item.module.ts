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
import { ItemChapterViewComponent } from './components/item-chapter-view/item-chapter-view.component';
import { GroupSituationChapterViewComponent } from
  './components/item-chapter-view/group-situation-chapter-view/group-situation-chapter-view.component';
import { UserProgressComponent } from './components/item-chapter-view/group-situation-chapter-view/user-progress/user-progress.component';

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
    GroupSituationChapterViewComponent,
    UserProgressComponent,
    ItemProgressComponent,
    ItemChapterViewComponent,
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class ItemModule { }
