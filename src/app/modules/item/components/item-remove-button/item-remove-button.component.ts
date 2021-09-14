import { Component, Input, OnChanges } from '@angular/core';
import { ReplaySubject, combineLatest } from 'rxjs';
import { distinct, map, switchMap, filter } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { Item } from '../../http-services/get-item-by-id.service';
import { ItemDataSource } from '../../services/item-datasource.service';
import { isNotNullOrUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { ConfirmationService } from 'primeng/api';
import { RemoveItemService } from '../../http-services/remove-item.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { Router } from '@angular/router';

@Component({
  selector: 'alg-item-remove-button',
  templateUrl: './item-remove-button.component.html',
  styleUrls: [ './item-remove-button.component.scss' ],
})
export class ItemRemoveButtonComponent implements OnChanges {
  @Input() item?: Item;

  private readonly id$ = new ReplaySubject<string>(1);
  readonly state$ = combineLatest([
    this.id$,
    this.itemDataSource.state$.pipe(
      map(state => {
        if (state.isReady) {
          return state.data.route.attemptId || state.data.route.parentAttemptId;
        }
        return null;
      }),
      filter(isNotNullOrUndefined),
    ),
  ]).pipe(
    distinct(),
    switchMap(([ id, attemptId ]) =>
      this.getItemChildrenService.get(id, attemptId).pipe(
        map((itemChildren: ItemChild[]) => itemChildren.length > 0)
      )
    ),
    mapToFetchState(),
  );

  deletionInProgress = false;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private itemDataSource: ItemDataSource,
    private confirmationService: ConfirmationService,
    private removeItemService: RemoveItemService,
    private actionFeedbackService: ActionFeedbackService,
    private router: Router,
  ) {
  }

  ngOnChanges(): void {
    if (this.item) {
      this.id$.next(this.item.id);
    }
  }

  onDeleteItem(): void {
    if (!this.item) {
      throw new Error('Unexpected: missed item input of component');
    }

    this.confirmationService.confirm({
      message: $localize`Deleting it will also remove permanently all answers and results related with this content.`,
      header: $localize`Are you sure you want to delete this content?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Yes`,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteItem();
      },
      rejectLabel: $localize`No`,
    });
  }

  deleteItem(): void {
    if (!this.item) {
      throw new Error('Unexpected: missed item input of component');
    }

    const id = this.item.id;
    const itemName = this.item.string.title;

    this.deletionInProgress = true;
    this.removeItemService.delete(id)
      .subscribe({
        next: () => {
          this.deletionInProgress = false;
          this.actionFeedbackService.success($localize`You have delete "${itemName}"`);
          this.navigateToMyRoot();
        },
        error: _err => {
          this.deletionInProgress = false;
          this.actionFeedbackService.error($localize`Failed to delete "${itemName}"`);
        }
      });
  }

  navigateToMyRoot(): void {
    void this.router.navigate([ '/' ]);
  }
}
