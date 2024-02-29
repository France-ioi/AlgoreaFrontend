import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemChildrenService, ItemChildren } from '../../../data-access/get-item-children.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { ConfirmationService } from 'primeng/api';
import { RemoveItemService } from '../../data-access/remove-item.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, AsyncPipe, I18nSelectPipe } from '@angular/common';

@Component({
  selector: 'alg-item-remove-button',
  templateUrl: './item-remove-button.component.html',
  styleUrls: [ './item-remove-button.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    ButtonModule,
    AsyncPipe,
    I18nSelectPipe,
  ],
})
export class ItemRemoveButtonComponent implements OnChanges, OnDestroy {
  @Output() confirmRemoval = new EventEmitter<void>();

  @Input() item?: Item;
  @Input() attemptId?: string;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) =>
      this.getItemChildrenService.get(id, attemptId).pipe(
        map((itemChildren: ItemChildren) => itemChildren.length > 0)
      )
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  deletionInProgress = false;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private confirmationService: ConfirmationService,
    private removeItemService: RemoveItemService,
    private actionFeedbackService: ActionFeedbackService,
    private router: Router,
  ) {
  }

  ngOnChanges(): void {
    if (this.item && this.attemptId) {
      this.params$.next({
        id: this.item.id,
        attemptId: this.attemptId,
      });
    }
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  onDeleteItem(): void {
    if (!this.item) {
      throw new Error('Unexpected: missed item input of component');
    }

    this.confirmationService.confirm({
      message: $localize`Deleting it will also remove permanently all answers and results related with this content.`,
      header: $localize`Are you sure you want to delete this content?`,
      icon: 'ph-duotone ph-warning-circle',
      acceptLabel: $localize`Yes`,
      acceptButtonStyleClass: 'danger',
      acceptIcon: 'ph-bold ph-check',
      accept: () => {
        this.confirmRemoval.emit();
        this.deleteItem();
      },
      rejectLabel: $localize`No`,
      rejectIcon: 'ph-bold ph-x',
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

  refresh(): void {
    this.refresh$.next();
  }
}
