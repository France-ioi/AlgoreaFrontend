import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { AllowsEditingAllItemPipe } from 'src/app/items/models/item-edit-permission';
import { IsAChapterPipe, IsATaskPipe } from 'src/app/items/models/item-type';
import { ItemData } from '../../models/item-data';
import { TaskStatsComponent } from '../task-stats/task-stats.component';
import { ChapterStatsComponent } from '../chapter-stats/chapter-stats.component';

/**
 * Top-level container for the item-stats tab. Performs the access checks
 * (cannot observe, must be allowed to edit) and dispatches to the proper
 * inner stats component depending on the item type (Chapter vs Task).
 *
 * Skills (and any other unsupported types) are explicitly handled here to
 * avoid silently flowing them into <alg-task-stats>, which would trigger
 * a permissions-token + /task-stats request with undefined behaviour.
 *
 * The inner components assume access is already granted and only deal with
 * fetching/rendering their own data.
 */
@Component({
  selector: 'alg-item-stats',
  imports: [ ErrorComponent, TaskStatsComponent, ChapterStatsComponent, AllowsEditingAllItemPipe, IsAChapterPipe, IsATaskPipe ],
  template: `
    @if (itemData(); as data) {
      @if (isObserving()) {
        <alg-error
          icon="ph ph-prohibit"
          i18n-message message="Statistics are not available while observing a group or user. Stop observation to view them."
        ></alg-error>
      } @else if (!(data.item.permissions | allowsEditingAll)) {
        <alg-error
          icon="ph ph-prohibit"
          i18n-message message="You are not allowed to view statistics for this content."
        ></alg-error>
      } @else if (data.item | isAChapter) {
        <alg-chapter-stats [itemData]="data"></alg-chapter-stats>
      } @else if (data.item | isATask) {
        <alg-task-stats [itemData]="data"></alg-task-stats>
      } @else {
        <alg-error
          icon="ph ph-prohibit"
          i18n-message message="Statistics are not available for this content type."
        ></alg-error>
      }
    }
  `,
})
export class ItemStatsComponent {
  private store = inject(Store);

  // Full ItemData for child stats components; may be narrowed later to only the fields they need.
  private readonly contentDataState = this.store.selectSignal(fromItemContent.selectActiveContentData);

  protected readonly itemData = computed((): ItemData | undefined => {
    const state = this.contentDataState();
    return state?.isReady ? state.data : undefined;
  });

  protected readonly isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
}
