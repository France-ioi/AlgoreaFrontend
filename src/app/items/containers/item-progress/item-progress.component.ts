import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { allowsViewingContent } from 'src/app/items/models/item-view-permission';
import { allowsWatchingResults } from 'src/app/items/models/item-watch-permission';
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
        <alg-item-group-progress class="alg-flex-1"></alg-item-group-progress>
      } @else {
        <alg-item-user-progress class="alg-flex-1"></alg-item-user-progress>
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
    const permissions = item.permissions;
    return (!this.isObserving() && allowsViewingContent(permissions)) || allowsWatchingResults(permissions);
  });
}
