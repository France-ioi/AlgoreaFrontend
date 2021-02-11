import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { FetchError, Fetching, isReady, Ready } from '../../../../shared/helpers/state';
import { ItemStringChanges, UpdateItemStringService } from '../../http-services/update-item-string.service';
import { TOAST_LENGTH } from '../../../../shared/constants/global';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from '../../../../shared/constants/api';
import { ItemChanges, UpdateItemService } from '../../http-services/update-item.service';
import { ChildData, ChildDataWithId, hasId } from '../../components/item-children-edit/item-children-edit.component';
import { Item } from '../../http-services/get-item-by-id.service';
import { ItemEditContentComponent } from '../item-edit-content/item-edit-content.component';
import { PendingChangesComponent } from 'src/app/shared/guards/pending-changes-guard';
import { CreateItemService, NewItem } from '../../http-services/create-item.service';
import { ItemEditAdvancedParametersComponent } from '../item-edit-advanced-parameters/item-edit-advanced-parameters.component';

@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: [ './item-edit.component.scss' ],
})
export class ItemEditComponent implements OnDestroy, PendingChangesComponent {
  itemForm = this.formBuilder.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    title: [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(200) ] ],
    subtitle: [ '', Validators.maxLength(200) ],
    description: '',
    url: [ '', Validators.maxLength(200) ],
    text_id: [ '', Validators.maxLength(200) ],
    uses_api: false,
    validation_type: '',
    no_score: false,
    title_bar_visible: false,
    prompt_to_join_group_by_code: false,
    full_screen: ''
  });
  itemChanges: { children?: ChildData[] } = {};

  itemData$ = this.itemDataSource.itemData$;
  itemLoadingState$ = this.itemDataSource.state$;
  initialFormData?: Item;

  subscription?: Subscription;

  @ViewChild('content') private editContent?: ItemEditContentComponent;
  @ViewChild('advancedParameters') private editAdvancedParameters?: ItemEditAdvancedParametersComponent;

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
      summary: $localize`Success`,
      detail: $localize`Changes successfully saved.`,
      life: TOAST_LENGTH,
    });
  }

  errorToast(message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: $localize`Error`,
      detail: message || ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  updateItemChanges(children: ChildData[]): void {
    this.itemForm.markAsDirty();
    this.itemChanges.children = children;
  }

  // Update Item
  private createChildren(): Observable<ChildDataWithId[] | undefined>{
    if (!this.itemChanges.children) return of(undefined);
    return forkJoin(
      this.itemChanges.children.map(child => {
        if (!this.initialFormData) return throwError(new Error('Invalid form'));
        if (hasId(child)) return of(child);
        // the child doesnt have an id so we create it
        if (!child.title) return throwError(new Error('Something went wrong, the new child is missing his title'));
        const newChild: NewItem = {
          title: child.title,
          type: child.type,
          languageTag: 'en',
          parent: this.initialFormData.id
        };
        return this.createItemService
          .create(newChild)
          .pipe(map(res => ({ id: res, ...child })));
      })
    );
  }

  private getItemChanges(): ItemChanges | undefined {
    const urlFormControl = this.itemForm.get('url');
    const usesApiFormControl = this.itemForm.get('uses_api');
    const textIdFormControl = this.itemForm.get('text_id');

    if (urlFormControl === null || usesApiFormControl === null || textIdFormControl === null) return undefined;

    const itemFormValues: ItemChanges = {};

    const url = urlFormControl.value as string;
    if (url !== this.initialFormData?.url) itemFormValues.url = url !== '' ? url : null;

    const usesApi = usesApiFormControl.value as boolean;
    if (usesApi !== this.initialFormData?.uses_api) itemFormValues.uses_api = usesApi;

    const textId = textIdFormControl.value as string;
    if (textId !== '') itemFormValues.text_id = textId;

    return itemFormValues;
  }

  private updateItem(): Observable<void> {
    return this.createChildren().pipe(
      switchMap(res => {
        if (!this.initialFormData) return throwError(new Error('Invalid initial data'));
        const changes = this.getItemChanges();
        if (!changes || !Object.keys(changes).length) return throwError(new Error('Invalid form'));
        if (res) {
          // @TODO: Avoid affecting component vars in Observable Operator
          // save the new children (their ids) to prevent recreating them in case of error
          this.itemChanges.children = res;
          changes.children = res.map((child, idx) => ({ item_id: child.id, order: idx }));
        }
        return this.updateItemService.updateItem(this.initialFormData.id, changes);
      }),
    );
  }

  // Item string changes
  private getItemStringChanges(): ItemStringChanges | undefined {
    const titleControl = this.itemForm.get('title');
    const subtitleControl = this.itemForm.get('subtitle');
    const descriptionControl = this.itemForm.get('description');
    const initialValues = this.initialFormData?.string;

    if (titleControl === null || subtitleControl === null || descriptionControl === null || !initialValues) return undefined;

    const res: ItemStringChanges = {};

    const title = titleControl.value as string;
    if (title !== initialValues.title) res.title = title.trim();

    const subtitle = (subtitleControl.value as string).trim() || null;
    if (subtitle !== initialValues.subtitle) res.subtitle = subtitle;

    const description = (descriptionControl.value as string).trim() || null;
    if (description !== initialValues.description) res.description = description;

    return res;
  }

  private updateString(): Observable<void> {
    if (!this.initialFormData) return throwError(new Error('Missing ID form'));
    const itemStringChanges = this.getItemStringChanges();
    if (!itemStringChanges) return throwError(new Error('Invalid form or initial data'));
    if (!Object.keys(itemStringChanges).length) return of(undefined);
    return this.updateItemStringService.updateItem(this.initialFormData.id, itemStringChanges);
  }

  save(): void {
    if (!this.initialFormData) return;

    if (this.itemForm.invalid) {
      this.errorToast($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }

    this.itemForm.disable();
    forkJoin([
      this.updateItem(),
      this.updateString(),
    ]).subscribe(
      _status => {
        this.successToast();
        this.itemDataSource.refreshItem(); // which will re-enable the form
      },
      _err => {
        this.errorToast();
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
      subtitle: item.string.subtitle || '',
      url: item.url || '',
      text_id: '',
      uses_api: item.uses_api || false,
      validation_type: item.validation_type || '',
      no_score: item.no_score || false,
      title_bar_visible: item.title_bar_visible || false,
      prompt_to_join_group_by_code: item.prompt_to_join_group_by_code || false,
      full_screen: item.full_screen || '',
    });

    this.itemChanges = {};
    this.itemForm.enable();
    this.editContent?.reset();
  }
}
