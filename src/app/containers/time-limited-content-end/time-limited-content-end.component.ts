import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { createSelector } from '@ngrx/store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRouteWith } from 'src/app/models/routing/item-route';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';
import { DialogRef } from '@angular/cdk/dialog';

const selectCurrentAttemptId = createSelector(
  fromItemContent.selectActiveContentCurrentResult,
  result => result?.attemptId ?? null,
);

const selectTimeLimitedContentRootItem = createSelector(
  fromItemContent.selectActiveContentBreadcrumbsState,
  selectCurrentAttemptId,
  (breadcrumbsState, attemptId) => {
    if (!breadcrumbsState.isReady || attemptId === null) return null;
    let curBreadcrumb = breadcrumbsState.data[breadcrumbsState.data.length - 1]!;
    for (let i = breadcrumbsState.data.length - 2; i >= 0; i--) {
      const parentAttemptId = breadcrumbsState.data[i]!.route.attemptId;
      if (parentAttemptId !== undefined && parentAttemptId !== attemptId) {
        const route = itemRouteWith(curBreadcrumb.route, { attemptId });
        return { ...curBreadcrumb, route };
      }
      curBreadcrumb = breadcrumbsState.data[i]!;
    }
    return curBreadcrumb;
  }
);

const selectActiveContentIsTimeLimitedContentRoot = createSelector(
  fromItemContent.selectActiveContentRoute,
  selectTimeLimitedContentRootItem,
  (route, rootItem) => route?.id === rootItem?.route.id && route?.attemptId === rootItem?.route.attemptId
);

@Component({
  selector: 'alg-time-limited-content-end',
  standalone: true,
  imports: [
    ButtonComponent,
    NotificationModalComponent,
  ],
  templateUrl: './time-limited-content-end.component.html',
  styleUrl: './time-limited-content-end.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeLimitedContentEndComponent {

  private itemRouter = inject(ItemRouter);
  private store = inject(Store);
  private currentContentService = inject(CurrentContentService);
  private dialogRef = inject(DialogRef);

  rootItem = this.store.selectSignal(selectTimeLimitedContentRootItem);

  activeContentIsRoot = this.store.selectSignal(selectActiveContentIsTimeLimitedContentRoot);

  closeDialog(): void {
    const rootItem = this.rootItem();
    if (!rootItem) throw new Error('unexpected: null rootItem with close dialog?');

    if (this.activeContentIsRoot()) {
      this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
    } else {
      this.itemRouter.navigateTo(rootItem.route);
    }

    this.currentContentService.forceNavMenuReload();
    this.dialogRef.close();
  }
}

