import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';
import { UpdateItemStringService } from '../../http-services/update-item-string.service';
import { Item } from '../../http-services/get-item-by-id.service';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';


@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss'],
  providers: [MessageService]
})
export class ItemEditComponent implements OnDestroy {
  item: Item;
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: ['', [Validators.required, Validators.minLength(3),]],
  });
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
    this.getCurrentItem();
    this.onSubmit();
  }

  ngOnDestroy() {
    this.currentContent.editState.next('non-editable');
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  getCurrentItem(): void {
    this.subscriptions.push(this.itemLoadingState$.pipe(
      filter<Ready<ItemData> | Fetching | FetchError, Ready<ItemData>>(isReady),
    ).subscribe(state => {
      this.item = state.data.item;
      this.itemForm.patchValue({
        title: this.item.string.title
      });
    }));
  }

  onSubmit(): void {
    this.subscriptions.push(this.currentContent.editAction$
      .pipe(filter(action => action === EditAction.Save))
      .subscribe(_action => this.saveInput()));
  }

  errorToast() :void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  successToast() : void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Changes successfully saved',
      life: TOAST_LENGTH,
    });
  }

  saveInput(): void {
    this.updateItemStringService.updateItem(
      this.item.id,
      this.itemForm.value
    ).subscribe(
      _status => {
        this.successToast();
        this.itemDataSource.refreshItem();
        this.currentContent.editAction.next(EditAction.Cancel);
      },
      _err => this.errorToast()
    );
  }

}
