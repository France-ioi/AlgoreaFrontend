import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { EMPTY, forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';
import { ItemStringChanges, UpdateItemStringService } from '../../http-services/update-item-string.service';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';
import { ItemChanges, UpdateItemService } from '../../http-services/update-item.service';
import { ChildData, ChildDataWithId, hasId } from '../../components/item-children-edit/item-children-edit.component';
import { CreateItemService, NewItem } from '../../http-services/create-item.service';

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
  });
  itemData$ = this.itemDataSource.itemData$;
  itemLoadingState$ = this.itemDataSource.state$;

  subscriptions: Subscription[] = [];
  itemChanges: { children?: ChildData[] } = {};

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
    private createItemService: CreateItemService,
    private updateItemService: UpdateItemService,
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

  updateItemChanges(children: ChildData[]): void {
    this.itemChanges.children = children;
  }

  // Update Item
  private getItemChanges(children: ChildDataWithId[]): ItemChanges {
    return {
      children: children.map((child, idx) => ({ item_id: child.id, order: idx }))
    };
  }

  private updateItem(): Observable<void> {
    if (!this.itemChanges.children) return EMPTY;
    return forkJoin(
      this.itemChanges.children.map(child => {
        if (!this.itemId) return throwError(new Error('Invalid form'));
        if (hasId(child)) return of(child);
        // the child doesn't have an id so we create it
        if (!child.title) return throwError(new Error('Something went wrong, the new child is missing his title'));
        const newChild: NewItem = {
          title: child.title,
          type: child.type,
          language_tag: 'en',
          parent: { item_id: this.itemId }
        };
        return this.createItemService
          .create(newChild)
          .pipe(map(res => ({ id: res, ...child })));
      }),
    ).pipe(
      switchMap(children => {
        // Saving the news children to not recreate them if there is an error.
        this.itemChanges.children = children;
        if (!this.itemId) return throwError(new Error('Invalid form'));
        return this.updateItemService.updateItem(this.itemId, this.getItemChanges(children));
      }),
    );
  }

  // Item string changes
  private getItemStringChanges(): ItemStringChanges | undefined {
    const title = this.itemForm.get('title');
    const description = this.itemForm.get('description');

    if (title === null || description === null) return undefined;

    return {
      title: (title.value as string).trim(),
      description: (description.value as string).trim() || null,
    };
  }

  private updateString(): Observable<void> {
    if (!this.itemId) return throwError(new Error('Missing ID form'));
    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) return throwError(new Error('Invalid form'));
    return this.updateItemStringService.updateItem(this.itemId, itemStringChanges);
  }

  saveInput(): void {
    if (!this.itemId) return;

    if (this.itemForm.invalid) {
      this.errorToast('You need to solve all the errors displayed in the form to save changes.');
      return;
    }

    forkJoin([
      this.updateItem(),
      this.updateString(),
    ]).subscribe(
      _status => {
        this.itemForm.disable();
        this.successToast();
        this.itemDataSource.refreshItem();
        this.currentContent.editAction.next(EditAction.StopEditing);
      },
      _err => this.errorToast(_err),
    );
  }
}
