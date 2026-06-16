import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { allowsViewingContent } from 'src/app/items/models/item-view-permission';
import { allowsWatchingResults } from 'src/app/items/models/item-watch-permission';
import { ItemData } from '../../models/item-data';
import { ItemLogViewComponent } from './item-log-view.component';

@Component({
  selector: 'alg-item-log-view-page',
  host: { class: 'alg-flex-1' },
  imports: [ ItemLogViewComponent ],
  template: `
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
    } @else if (itemData(); as data) {
      <alg-item-log-view [itemData]="data"></alg-item-log-view>
    }
  `,
})
export class ItemLogViewPageComponent {
  private store = inject(Store);

  private readonly item = this.store.selectSignal(fromItemContent.selectActiveContentItem);
  private readonly route = this.store.selectSignal(fromItemContent.selectActiveContentRoute);
  private readonly currentResult = this.store.selectSignal(fromItemContent.selectActiveContentCurrentResult);
  protected readonly isObserving = this.store.selectSignal(fromObservation.selectIsObserving);

  protected readonly itemData = computed((): ItemData | undefined => {
    const item = this.item();
    const route = this.route();
    if (!item || !route) {
      return undefined;
    }
    return {
      route,
      item,
      breadcrumbs: [],
      currentResult: this.currentResult() ?? undefined,
    };
  });

  protected readonly canView = computed(() => {
    const item = this.item();
    if (!item) {
      return false;
    }
    const permissions = item.permissions;
    return (!this.isObserving() && allowsViewingContent(permissions)) || allowsWatchingResults(permissions);
  });
}
