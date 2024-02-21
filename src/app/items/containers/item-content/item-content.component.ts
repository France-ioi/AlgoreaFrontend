import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { TaskConfig } from '../../services/item-task.service';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ItemChildrenEditFormComponent
} from '../../containers/item-children-edit-form/item-children-edit-form.component';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { BehaviorSubject } from 'rxjs';
import { AllowsEditingChildrenItemPipe } from 'src/app/models/item-edit-permission';
import { AllowsViewingItemContentPipe } from 'src/app/models/item-view-permission';
import { TaskLoaderComponent } from '../../containers/task-loader/task-loader.component';
import { ItemUnlockAccessComponent } from '../../containers/item-unlock-access/item-unlock-access.component';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';
import { ParentSkillsComponent } from '../../containers/parent-skills/parent-skills.component';
import { SubSkillsComponent } from '../../containers/sub-skills/sub-skills.component';
import { ChapterChildrenComponent } from '../../containers/chapter-children/chapter-children.component';
import { HasHTMLDirective } from 'src/app/directives/has-html.directive';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { MessageIconComponent } from '../../../ui-components/message-icon/message-icon.component';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    HasHTMLDirective,
    SwitchComponent,
    ItemChildrenEditFormComponent,
    ChapterChildrenComponent,
    SubSkillsComponent,
    ParentSkillsComponent,
    ItemDisplayComponent,
    NgClass,
    MessageInfoComponent,
    ItemUnlockAccessComponent,
    TaskLoaderComponent,
    AsyncPipe,
    AllowsViewingItemContentPipe,
    AllowsEditingChildrenItemPipe,
    ErrorComponent,
    MessageIconComponent,
  ],
})
export class ItemContentComponent implements PendingChangesComponent {
  @ViewChild(ItemDisplayComponent) itemDisplayComponent?: ItemDisplayComponent;
  @ViewChild(ItemChildrenEditFormComponent) itemChildrenEditFormComponent?: ItemChildrenEditFormComponent;
  @ViewChild(SwitchComponent) switchComponent?: SwitchComponent;

  @Input() itemData?: ItemData;
  @Input() taskView?: TaskTab['view'];
  @Input() taskConfig: TaskConfig|null = null;
  @Input() savingAnswer = false;
  @Input() editModeEnabled = false;

  @Output() taskTabsChange = new EventEmitter<TaskTab[]>();
  @Output() taskViewChange = new EventEmitter<TaskTab['view']>();
  @Output() scoreChange = new EventEmitter<number>();
  @Output() skipSave = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() editorUrl = new EventEmitter<string|undefined>();
  @Output() disablePlatformProgress = new EventEmitter<boolean>();
  @Output() fullFrameTask = new EventEmitter<boolean>();

  isTaskLoaded$ = new BehaviorSubject(false); // whether the task has finished loading, i.e. is ready or in error

  isDirty(): boolean {
    return !!this.itemChildrenEditFormComponent?.dirty;
  }

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  onEditModeEnableChange(editModeEnabled: boolean): void {
    void this.router.navigate([ editModeEnabled ? './edit-children' : './' ], {
      relativeTo: this.route,
    }).then(redirected => {
      if (!editModeEnabled && !redirected) {
        this.switchComponent?.writeValue(true);
      }
    });
  }

  onScoreChange(score: number): void {
    this.scoreChange.emit(score);
    this.store.dispatch(fromForum.itemPageEventSyncActions.forceSyncCurrentThreadEvents());
  }

}
