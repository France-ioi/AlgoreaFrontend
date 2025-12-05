import { Component, EventEmitter, Input, Output, ViewChild, computed, input, signal } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { TaskConfig } from '../../services/item-task.service';
import { ItemDisplayComponent, TaskTab } from '../item-display/item-display.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ItemChildrenEditFormComponent
} from '../../containers/item-children-edit-form/item-children-edit-form.component';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { AllowsEditingAllItemPipe, AllowsEditingChildrenItemPipe } from 'src/app/items/models/item-edit-permission';
import { AllowsViewingItemContentPipe } from 'src/app/items/models/item-view-permission';
import { TaskLoaderComponent } from '../../containers/task-loader/task-loader.component';
import { ItemUnlockAccessComponent } from '../../containers/item-unlock-access/item-unlock-access.component';
import { ParentSkillsComponent } from '../../containers/parent-skills/parent-skills.component';
import { SubSkillsComponent } from '../../containers/sub-skills/sub-skills.component';
import { ChapterChildrenComponent } from '../../containers/chapter-children/chapter-children.component';
import { HasHTMLDirective } from 'src/app/directives/has-html.directive';
import { NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { IsAChapterPipe, IsASkillPipe, isATask } from '../../models/item-type';
import { ExplicitEntryComponent } from '../explicit-entry/explicit-entry.component';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from 'src/app/services/user-session.service';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ResultIsActivePipe } from '../../models/attempts';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ],
  standalone: true,
  imports: [
    HasHTMLDirective,
    SwitchComponent,
    ItemChildrenEditFormComponent,
    ChapterChildrenComponent,
    SubSkillsComponent,
    ParentSkillsComponent,
    ItemDisplayComponent,
    ExplicitEntryComponent,
    NgClass,
    ItemUnlockAccessComponent,
    TaskLoaderComponent,
    AllowsViewingItemContentPipe,
    AllowsEditingChildrenItemPipe,
    AllowsEditingAllItemPipe,
    ErrorComponent,
    IsAChapterPipe,
    IsASkillPipe,
    FormsModule,
    ResultIsActivePipe,
  ],
})
export class ItemContentComponent implements PendingChangesComponent {
  @ViewChild(ItemDisplayComponent) itemDisplayComponent?: ItemDisplayComponent;
  @ViewChild(ItemChildrenEditFormComponent) itemChildrenEditFormComponent?: ItemChildrenEditFormComponent;
  @ViewChild(SwitchComponent) switchComponent?: SwitchComponent;

  itemData = input.required<ItemData>();
  private item = computed(() => this.itemData().item);
  /**
   * Item description, only if it should be shown
   */
  description = computed(() => {
    const description = this.item().string.description;
    return (!isATask(this.item()) && description /* not null, undefined or empty */) ? description : null;
  });

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

  isTaskLoaded = signal(false); // whether the task has finished loading, i.e. is ready or in error
  isCurrentUserTemp = toSignal(this.userSessionService.userProfile$.pipe(map(user => user.tempUser)));
  hasPrerequisites: boolean|undefined = undefined; // undefined while not known

  isDirty(): boolean {
    return !!this.itemChildrenEditFormComponent?.dirty;
  }

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private userSessionService: UserSessionService,
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
  }

  onTaskLoadChange(loadingComplete: boolean): void {
    this.isTaskLoaded.set(loadingComplete);
  }

  onPrerequisiteNotify(hasPrerequisites: boolean): void {
    this.hasPrerequisites = hasPrerequisites;
  }
}
