import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { TaskConfig } from '../../services/item-task.service';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ItemChildrenEditFormComponent
} from '../../components/item-children-edit-form/item-children-edit-form.component';
import { PendingChangesComponent } from '../../../../shared/guards/pending-changes-guard';
import { SwitchComponent } from '../../../shared-components/components/switch/switch.component';
import { DiscussionService } from '../../services/discussion.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
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
  @Output() fullFrameTask = new EventEmitter<boolean>();

  isTaskLoaded$ = new BehaviorSubject(false); // whether the task has finished loading, i.e. is ready or in error

  isDirty(): boolean {
    return !!this.itemChildrenEditFormComponent?.dirty;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private discussionService: DiscussionService,
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
    this.discussionService.resyncEventLog();
  }

}
