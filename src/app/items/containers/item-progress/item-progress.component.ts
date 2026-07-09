import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { canCurrentUserWatchResult } from 'src/app/items/models/item-watch-permission';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from 'src/app/items/store';
import { ItemGroupProgressComponent } from '../item-group-progress/item-group-progress.component';
import { ItemUserProgressComponent } from '../item-user-progress/item-user-progress.component';

@Component({
  selector: 'alg-item-progress',
  host: { class: 'alg-flex-1' },
  template: `
    @if (item()) {
      @if (!canView()) {
        @if (isObserving()) {
          <p class="not-allow-caption" i18n>
            You are not allowed to view the progress of other users on this content.
          </p>
        } @else {
          <p class="not-allow-caption" i18n>
            You are not allowed to view this content.
          </p>
        }
      } @else if (isObserving() && observedGroup()?.route?.contentType !== 'user') {
        <alg-item-group-progress class="alg-flex-1" />
      } @else {
        <alg-item-user-progress class="alg-flex-1" />
      }
    }
  `,
  imports: [ ItemGroupProgressComponent, ItemUserProgressComponent ],
})
export class ItemProgressComponent {
  private store = inject(Store);

  protected readonly item = this.store.selectSignal(fromItemContent.selectActiveContentItem);
  protected readonly isObserving = this.store.selectSignal(fromObservation.selectIsObserving);
  protected readonly observedGroup = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  protected readonly canView = computed(() => {
    const item = this.item();
    if (!item) {
      return false;
    }
    return (!this.isObserving() && canCurrentUserViewContent(item)) || canCurrentUserWatchResult(item);
  });
}
