import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';
import { ItemStringChanges, UpdateItemStringService } from '../../http-services/update-item-string.service';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';


@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: [ './item-edit.component.scss' ],
})
export class ItemEditComponent implements OnDestroy {
  itemId? : string;
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200) ] ],
    description: '',
    children: [],
  });
  itemData$ = this.itemDataSource.itemData$;
  itemLoadingState$ = this.itemDataSource.state$;

  subscriptions: Subscription[] = [];

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
    private updateItemStringService: UpdateItemStringService,
    private messageService: MessageService
  ) {
    this.currentContent.editState.next('editing');
    this.subscriptions.push(
      this.itemLoadingState$.pipe(filter<Ready<ItemData> | Fetching | FetchError, Ready<ItemData>>(isReady))
        .subscribe(state => {
          const item = state.data.item;
          this.itemId = item.id;
          this.itemForm.patchValue({
            title: item.string.title || '',
            description: item.string.description || '',
            children: [],
          });
        }),
      this.currentContent.editAction$.pipe(filter(action => action === EditAction.Save))
        .subscribe(_action => this.saveInput())
    );
  }

  ngOnDestroy(): void {
    this.currentContent.editState.next('non-editable');
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  successToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Changes successfully saved.',
      life: TOAST_LENGTH,
    });
  }

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  getItemStringChanges(): ItemStringChanges {
    const title = this.itemForm.get('title');
    const description = this.itemForm.get('description');

    if (title === null || description === null) // Something is wrong with the form
      return {};

    return {
      title: (title.value as string).trim(),
      description: (description.value as string).trim() || null
    };
  }

  saveInput(): void {
    if (!this.itemId) return;

    if (this.itemForm.invalid) {
      this.errorToast('You need to solve all the errors displayed in the form to save changes.');
      return;
    }

    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) {
      this.errorToast();
      return;
    }

    this.updateItemStringService.updateItem(
      this.itemId,
      itemStringChanges
    ).subscribe(
      _status => {
        this.itemForm.disable();
        this.successToast();
        this.itemDataSource.refreshItem();
        this.currentContent.editAction.next(EditAction.StopEditing);
      },
      _err => this.errorToast()
    );
  }

}
