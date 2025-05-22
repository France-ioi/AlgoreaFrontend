import { ChangeDetectionStrategy, Component, inject, OnDestroy, computed, input, output, signal } from '@angular/core';
import { EMPTY, Subject, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { ConfirmationService } from 'primeng/api';
import { RemoveItemService } from '../../data-access/remove-item.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemData } from '../../models/item-data';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { IsAChapterPipe, IsASkillPipe, isATask } from '../../models/item-type';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { parentRoute } from 'src/app/models/routing/item-route';
import { DEFAULT_ACTIVITY_ROUTE } from 'src/app/models/routing/default-route-tokens';

import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-item-remove-button',
  templateUrl: './item-remove-button.component.html',
  styleUrls: [ './item-remove-button.component.scss' ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingComponent,
    ErrorComponent,
    IsAChapterPipe,
    IsASkillPipe,
    ButtonComponent,
  ],
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
      if (!currentResult) return EMPTY;
      return this.getItemChildrenService.get(item.id, currentResult.attemptId).pipe(
        map((itemChildren: ItemChildren) => itemChildren.length === 0),
      );
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  canDeleteState = toSignal(this.canDeleteState$, { requireSync: true });

  deletionInProgress = signal(false);

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private confirmationService: ConfirmationService,
    private removeItemService: RemoveItemService,
    private actionFeedbackService: ActionFeedbackService,
    private itemRouter: ItemRouter,
  ) {
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  onDeleteItem(): void {
    this.confirmationService.confirm({
      message: $localize`Deleting it will also remove permanently all answers and results related with this content.`,
      header: $localize`Are you sure you want to delete this content?`,
      icon: 'ph-duotone ph-warning-circle',
      acceptLabel: $localize`Yes`,
      acceptButtonStyleClass: 'danger',
      acceptIcon: 'ph-bold ph-check',
      accept: () => this.onDeleteItemConfirmed(),
      rejectLabel: $localize`No`,
      rejectIcon: 'ph-bold ph-x',
    });
  }

  onDeleteItemConfirmed(): void {
    this.confirmRemoval.emit();

    const id = this.itemData().item.id;
    const itemName = this.itemData().item.string.title;
    this.deletionInProgress.set(true);
    this.removeItemService.delete(id).subscribe({
      next: () => {
        this.deletionInProgress.set(false);
        this.actionFeedbackService.success($localize`You have delete "${itemName}"`);
        this.postDeletionNavigation();
      },
      error: () => {
        this.deletionInProgress.set(false);
        this.actionFeedbackService.error($localize`Failed to delete "${itemName}"`);
      }
    });
  }

  postDeletionNavigation(): void {
    const defaultActivityRoute = inject(DEFAULT_ACTIVITY_ROUTE);
    this.itemRouter.navigateTo(parentRoute(this.itemData().route, defaultActivityRoute));
  }

  refresh(): void {
    this.refresh$.next();
  }
}
