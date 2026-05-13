import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
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
import { DescriptionIframeComponent } from 'src/app/ui-components/description-iframe/description-iframe.component';
import { DescriptionIframeNavigationRequest } from 'src/app/ui-components/description-iframe/description-iframe.messages';
import { Location, NgClass } from '@angular/common';
import { LoginWallComponent } from '../login-wall/login-wall.component';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { IsAChapterPipe, IsASkillPipe, isATask } from '../../models/item-type';
import { ExplicitEntryComponent } from '../explicit-entry/explicit-entry.component';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from 'src/app/services/user-session.service';
import { Subject, map, merge, take, timer } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ResultIsActivePipe } from '../../models/attempts';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRoute } from 'src/app/models/routing/item-route';
import { MessageService } from 'src/app/services/message.service';
import { openNewTab } from 'src/app/utils/url';

/**
 * Auto-open delay (ms) for `alg.navigate`-`{ url }` requests originating from the description iframe.
 * Tuned to stay inside the browser's ~1s "transient user activation" window so popup blockers stand
 * down. The toast remains clickable as a user-gesture fallback if the window has already been consumed.
 */
const EXTERNAL_URL_AUTO_OPEN_DELAY_MS = 900;

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ],
  imports: [
    DescriptionIframeComponent,
    SwitchComponent,
    ItemChildrenEditFormComponent,
    ChapterChildrenComponent,
    SubSkillsComponent,
    ParentSkillsComponent,
    ItemDisplayComponent,
    ExplicitEntryComponent,
    NgClass,
    LoginWallComponent,
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
  ]
})
export class ItemContentComponent implements PendingChangesComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userSessionService = inject(UserSessionService);
  private itemRouter = inject(ItemRouter);
  private messageService = inject(MessageService);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

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
    return (!isATask(this.item()) && description && description.trim() !== '') ? description : null;
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
  showTaskDisplay = signal(true);
  isCurrentUserTemp = toSignal(this.userSessionService.userProfile$.pipe(map(user => user.tempUser)));
  hasPrerequisites: boolean|undefined = undefined; // undefined while not known

  isDirty(): boolean {
    return !!this.itemChildrenEditFormComponent?.dirty;
  }

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

  onTaskRetry(): void {
    this.isTaskLoaded.set(false);
    this.showTaskDisplay.set(false);
    setTimeout(() => this.showTaskDisplay.set(true));
  }

  onTaskLoadChange(loadingComplete: boolean): void {
    this.isTaskLoaded.set(loadingComplete);
  }

  onPrerequisiteNotify(hasPrerequisites: boolean): void {
    this.hasPrerequisites = hasPrerequisites;
  }

  onDescriptionNavigate(req: DescriptionIframeNavigationRequest): void {
    if ('url' in req) {
      this.openExternalUrlWithToast(req.url);
      return;
    }
    if (req.child) {
      const route = this.itemData().route;
      const path = [ ...route.path, route.id ];
      this.itemRouter.navigateTo(itemRoute('activity', req.itemId, { path }), { useCurrentObservation: true });
      return;
    }
    // Path-less RawItemRoute: ItemByIdComponent resolves the path post-navigation
    // (same pattern as RedirectToIdComponent).
    this.itemRouter.navigateTo(itemRoute('activity', req.itemId), { useCurrentObservation: true });
  }

  private openExternalUrlWithToast(url: string): void {
    const clicked$ = new Subject<void>();
    this.messageService.add({
      severity: 'info',
      summary: $localize`:@@externalLinkToastTitle:Navigating to an external link`,
      detail: url,
      onClick: () => clicked$.next(),
    });
    merge(clicked$, timer(EXTERNAL_URL_AUTO_OPEN_DELAY_MS))
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => openNewTab(url, this.location));
  }
}
