import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { allowsEditingAll } from 'src/app/items/models/item-edit-permission';
import { isAChapter } from 'src/app/items/models/item-type';
import { ItemData } from '../../models/item-data';
import { TaskStatsComponent } from '../task-stats/task-stats.component';
import { ChapterStatsComponent } from '../chapter-stats/chapter-stats.component';

/**
 * Top-level container for the item-stats tab. Performs the access checks
 * (cannot observe, must be allowed to edit) and dispatches to the proper
 * inner stats component depending on the item type (Chapter vs Task).
 *
 * The inner components assume access is already granted and only deal with
 * fetching/rendering their own data.
 */
@Component({
  selector: 'alg-item-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ErrorComponent, TaskStatsComponent, ChapterStatsComponent ],
  template: `
    @if (itemData(); as data) {
      @if (isObserving()) {
        <alg-error
          icon="ph ph-prohibit"
          i18n-message message="Statistics are not available while observing a group or user. Stop observation to view them."
        ></alg-error>
      } @else if (!canEdit()) {
        <alg-error
          icon="ph ph-prohibit"
          i18n-message message="You are not allowed to view statistics for this content."
        ></alg-error>
      } @else if (isChapter()) {
        <alg-chapter-stats [itemData]="data"></alg-chapter-stats>
      } @else {
        <alg-task-stats [itemData]="data"></alg-task-stats>
      }
    }
  `,
})
export class ItemStatsComponent {
  private store = inject(Store);

  readonly itemData = input.required<ItemData>();

  readonly isObserving = this.store.selectSignal(fromObservation.selectIsObserving);

  readonly canEdit = computed(() => allowsEditingAll(this.itemData().item.permissions));
  readonly isChapter = computed(() => isAChapter(this.itemData().item));
}
