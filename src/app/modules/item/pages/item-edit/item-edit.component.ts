import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';
import { ItemStringChanges, UpdateItemStringService } from '../../http-services/update-item-string.service';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';
import { ItemChanges, UpdateItemService } from '../../http-services/update-item.service';
import { ChildData } from '../../components/item-children-edit/item-children-edit.component';
import { Item } from '../../http-services/get-item-by-id.service';
import { ItemEditContentComponent } from '../item-edit-content/item-edit-content.component';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';

@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: [ './item-edit.component.scss' ],
})
export class ItemEditComponent implements OnDestroy, PendingChangesComponent {
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200) ] ],
    description: '',
  });
  itemData$ = this.itemDataSource.itemData$;
  itemLoadingState$ = this.itemDataSource.state$;
  initialFormData?: Item;

  subscription?: Subscription;
  itemChanges: ItemChanges = {};

  @ViewChild('content') private editContent?: ItemEditContentComponent;

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
    private updateItemService: UpdateItemService,
    private updateItemStringService: UpdateItemStringService,
    private messageService: MessageService
  ) {
    this.currentContent.editState.next('editing');
    this.subscription = this.itemLoadingState$
      .pipe(filter<Ready<ItemData> | Fetching | FetchError, Ready<ItemData>>(isReady))
      .subscribe(state => {
        this.initialFormData = state.data.item;
        this.resetFormWith(state.data.item);
      });
  }

  ngOnDestroy(): void {
    this.currentContent.editState.next('non-editable');
    this.subscription?.unsubscribe();
  }

  isDirty(): boolean {
    return this.itemForm.dirty;
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

  updateItemChanges(children: ChildData[]): void {
    this.itemForm.markAsDirty();
    // FIXME: temp fix to compile and not send bad data to the service
    this.itemChanges.children = children
      .filter(child => child.id)
      .map((child, idx) => ({ item_id: child.id as string, order: idx }));
  }


  getItemStringChanges(): ItemStringChanges | undefined {
    const title = this.itemForm.get('title');
    const description = this.itemForm.get('description');

    if (title === null || description === null) return undefined;

    return {
      title: (title.value as string).trim(),
      description: (description.value as string).trim() || null
    };
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.itemForm.invalid) {
      this.errorToast('You need to solve all the errors displayed in the form to save changes.');
      return;
    }

    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) {
      this.errorToast();
      return;
    }

    this.itemForm.disable();
    combineLatest([
      this.updateItemService.updateItem(this.initialFormData.id, this.itemChanges),
      this.updateItemStringService.updateItem(this.initialFormData.id, itemStringChanges),
    ]).subscribe(
      _status => {
        this.successToast();
        this.itemDataSource.refreshItem(); // which will re-enable the form
      },
      _err => {
        this.errorToast(_err);
        this.itemForm.enable();
      }
    );
  }

  resetForm(): void {
    if (this.initialFormData) this.resetFormWith(this.initialFormData);
  }

  private resetFormWith(item: Item): void {
    this.itemForm.reset({
      title: item.string.title || '',
      description: item.string.description || '',
    });
    this.itemForm.enable();
    this.editContent?.reset();
  }
}
