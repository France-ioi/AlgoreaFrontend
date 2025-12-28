import { ChangeDetectionStrategy, Component, inject, OnDestroy, computed, input, output, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { RemoveItemService } from '../../data-access/remove-item.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemData } from '../../models/item-data';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { IsAChapterPipe, IsASkillPipe, isATask } from '../../models/item-type';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { parentRoute } from 'src/app/models/routing/item-route';
import { DEFAULT_ACTIVITY_ROUTE } from 'src/app/config/default-route-tokens';

import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';

@Component({
  selector: 'alg-item-remove-button',
  templateUrl: './item-remove-button.component.html',
  styleUrls: [ './item-remove-button.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingComponent,
    ErrorComponent,
    IsAChapterPipe,
    IsASkillPipe,
    ButtonComponent,
  ]
})
export class ItemRemoveButtonComponent implements OnDestroy {

  confirmRemoval = output();
  itemData = input.required<ItemData>();
  isOwner = computed(() => this.itemData().item.permissions.isOwner);

  private refresh$ = new Subject<void>();

  readonly canDeleteState$ = toObservable(this.itemData).pipe(
    distinctUntilChanged((a, b) => a.item.id === b.item.id && a.currentResult?.attemptId === b.currentResult?.attemptId),
    switchMap(({ item, currentResult }) => {
      if (!item.permissions.isOwner) return of(false);
      if (isATask(item)) return of(true);
      // in that case, there is no guarantee that the item can be deleted as we cannot know if it has children
      if (!currentResult) return of(false);
      return this.getItemChildrenService.get(item.id, currentResult.attemptId).pipe(
        map((itemChildren: ItemChildren) => itemChildren.length === 0),
      );
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  canDeleteState = toSignal(this.canDeleteState$, { requireSync: true });

  deletionInProgress = signal(false);

  defaultActivityRoute = inject(DEFAULT_ACTIVITY_ROUTE);

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private confirmationModalService: ConfirmationModalService,
    private removeItemService: RemoveItemService,
    private actionFeedbackService: ActionFeedbackService,
    private itemRouter: ItemRouter,
  ) {
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  onDeleteItem(): void {
    const id = this.itemData().item.id;
    const itemName = this.itemData().item.string.title;

    const confirmation$ = this.confirmationModalService.open({
      title: $localize`Are you sure you want to delete this content?`,
      message: $localize`Deleting it will also remove permanently all answers and results related with this content.`,
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
      acceptButtonIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      rejectButtonIcon: 'ph-bold ph-x',
    }).pipe(filter(accept => !!accept));

    confirmation$.subscribe(() => this.confirmRemoval.emit());

    this.deletionInProgress.set(true);
    confirmation$.pipe(
      switchMap(() => this.removeItemService.delete(id)),
    ).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`You have delete "${itemName}"`);
        this.postDeletionNavigation();
      },
      error: () => {
        this.actionFeedbackService.error($localize`Failed to delete "${itemName}"`);
      },
      complete: () => this.deletionInProgress.set(false),
    });
  }

  postDeletionNavigation(): void {
    this.itemRouter.navigateTo(parentRoute(this.itemData().route, this.defaultActivityRoute), { useCurrentObservation: true });
  }

  refresh(): void {
    this.refresh$.next();
  }
}
