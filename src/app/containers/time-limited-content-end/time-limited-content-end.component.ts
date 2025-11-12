import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { DialogModule } from 'primeng/dialog';
import { fromItemContent } from 'src/app/items/store';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { createSelector } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRouteUsingParentAttempt } from 'src/app/models/routing/item-route';

const selectCurrentAttemptId = createSelector(
  fromItemContent.selectActiveContentCurrentResult,
  result => result?.attemptId ?? null,
);

const selectTimeLimitedContentRootItem = createSelector(
  fromItemContent.selectActiveContentBreadcrumbsState,
  selectCurrentAttemptId,
  (breadcrumbsState, attemptId) => {
    if (!breadcrumbsState.isReady) return null;
    let curBreadcrumb = breadcrumbsState.data[breadcrumbsState.data.length - 1]!;
    for (let i = breadcrumbsState.data.length - 2; i >= 0; i--) {
      if (breadcrumbsState.data[i]!.route.attemptId !== attemptId) {
        const route = itemRouteUsingParentAttempt(curBreadcrumb.route, breadcrumbsState.data[i]!.route.attemptId);
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
  (route, rootItem) => route?.id === rootItem?.route.id
);

@Component({
  selector: 'alg-time-limited-content-end',
  standalone: true,
  imports: [
    DialogModule,
    ButtonComponent,
    RouterLink,
    RouteUrlPipe,
  ],
  templateUrl: './time-limited-content-end.component.html',
  styleUrl: './time-limited-content-end.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeLimitedContentEndComponent {

  private itemRouter = inject(ItemRouter);
  private store = inject(Store);

  rootItem = this.store.selectSignal(selectTimeLimitedContentRootItem);
  visible = signal(true);

  activeContentIsRoot = this.store.selectSignal(selectActiveContentIsTimeLimitedContentRoot);

  closeDialog(): void {
    this.visible.set(false);
    const rootItem = this.rootItem();
    if (!rootItem) throw new Error('unexpected: null rootItem with close dialog?');

    if (this.activeContentIsRoot()) {
      this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
    } else {
      this.itemRouter.navigateTo(rootItem.route);
    }
  }
}

