import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { readyData } from 'src/app/shared/operators/state';

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
    description: [ '' ],
    url: [ '', Validators.maxLength(200) ],
    text_id: [ '', Validators.maxLength(200) ],
    uses_api: [ false ],
    validation_type: [ '' ],
    no_score: [ false ],
    title_bar_visible: [ false ],
    prompt_to_join_group_by_code: [ false ],
    full_screen: [ '' ],
    allows_multiple_attempts: [ false ],
    requires_explicit_entry: [ false ],
    durationOn: [ false ],
    duration: [ null, [ Validators.required ] ],
    entering_time_min: [ null ],
    entering_time_max: [ null ],
  });
  itemChanges: { children?: ChildData[] } = {};

  fetchState$ = this.itemDataSource.state$;
  initialFormData?: Item;

  subscription?: Subscription;

  @ViewChild('content') private editContent?: ItemEditContentComponent;
  @ViewChild('advancedParameters') private editAdvancedParameters?: ItemEditAdvancedParametersComponent;

  constructor(
    private modeService: ModeService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
    private createItemService: CreateItemService,
    private updateItemService: UpdateItemService,
    private updateItemStringService: UpdateItemStringService,
    private messageService: MessageService
  ) {
    this.modeService.mode$.next(Mode.Editing);
    this.subscription = this.fetchState$
      .pipe(readyData())
      .subscribe(data => {
        this.initialFormData = data.item;
        this.resetFormWith(data.item);
      });
  }

  ngOnDestroy(): void {
    this.modeService.mode$.next(Mode.Normal);
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
    const formControls: {[key: string]: AbstractControl | null} = {
      url: this.itemForm.get('url'),
      textId: this.itemForm.get('text_id'),
      usesApi: this.itemForm.get('uses_api'),
      validationType: this.itemForm.get('validation_type'),
      noScore: this.itemForm.get('no_score'),
      titleBarVisible: this.itemForm.get('title_bar_visible'),
      promptToJoinGroupByCode: this.itemForm.get('prompt_to_join_group_by_code'),
      fullScreen: this.itemForm.get('full_screen'),
      allows_multiple_attempts: this.itemForm.get('allows_multiple_attempts'),
      requires_explicit_entry: this.itemForm.get('requires_explicit_entry'),
      durationOn: this.itemForm.get('durationOn'),
      duration: this.itemForm.get('duration'),
      entering_time_min: this.itemForm.get('entering_time_min'),
      entering_time_max: this.itemForm.get('entering_time_max'),
    };

    if (Object.values(formControls).includes(null) || !this.initialFormData) return undefined;

    const itemFormValues: ItemChanges = {};

    const url = formControls.url?.value !== '' ? formControls.url?.value as string : null;
    if (url !== this.initialFormData.url) itemFormValues.url = url;

    const usesApi = formControls.usesApi?.value as boolean;
    if (usesApi !== this.initialFormData.usesApi) itemFormValues.uses_api = usesApi;

    const textId = formControls.textId?.value as string;
    if (textId !== '') itemFormValues.text_id = textId;

    const validationType = formControls.validationType?.value as 'None' | 'All' | 'AllButOne' | 'Categories' | 'One' | 'Manual';
    if (validationType !== this.initialFormData.validationType) itemFormValues.validation_type = validationType;

    const noScore = formControls.noScore?.value as boolean;
    if (noScore !== this.initialFormData.noScore) itemFormValues.no_score = noScore;

    const titleBarVisible = formControls.titleBarVisible?.value as boolean;
    if (titleBarVisible !== this.initialFormData.titleBarVisible) itemFormValues.title_bar_visible = titleBarVisible;

    const promptToJoinGroupByCode = formControls.promptToJoinGroupByCode?.value as boolean;
    if (promptToJoinGroupByCode !== this.initialFormData.promptToJoinGroupByCode)
      itemFormValues.prompt_to_join_group_by_code = promptToJoinGroupByCode;

    const fullScreen = formControls.fullScreen?.value as 'forceYes' | 'forceNo' | 'default';
    if (fullScreen !== this.initialFormData.fullScreen) itemFormValues.full_screen = fullScreen;

    const allowsMultipleAttempts = formControls.allows_multiple_attempts?.value as boolean;
    if (allowsMultipleAttempts !== this.initialFormData.allowsMultipleAttempts) {
      itemFormValues.allows_multiple_attempts = allowsMultipleAttempts;
    }

    const requiresExplicitEntry = formControls.requires_explicit_entry?.value as boolean;
    if (requiresExplicitEntry !== this.initialFormData.requiresExplicitEntry) {
      itemFormValues.requires_explicit_entry = requiresExplicitEntry;
    }

    const durationOn = formControls.durationOn?.value as boolean;
    const duration = formControls.duration?.value as string;

    if (duration !== this.initialFormData.duration || !durationOn || !requiresExplicitEntry) {
      itemFormValues.duration = durationOn && requiresExplicitEntry ? duration : null;
    }

    const enteringTimeMin = formControls.entering_time_min?.value as string;
    if (+new Date(enteringTimeMin) !== +new Date(this.initialFormData.enteringTimeMin) || !requiresExplicitEntry) {
      itemFormValues.entering_time_min = requiresExplicitEntry ? enteringTimeMin : '9999-12-31T21:59:59.000Z';
    }

    const enteringTimeMax = formControls.entering_time_max?.value as string;
    if (+new Date(enteringTimeMax) !== +new Date(this.initialFormData.enteringTimeMax) || !requiresExplicitEntry) {
      itemFormValues.entering_time_max = requiresExplicitEntry ? enteringTimeMax : '9999-12-31T21:59:59.000Z';
    }

    return itemFormValues;
  }

  private updateItem(): Observable<void> {
    return this.createChildren().pipe(
      switchMap(res => {
        if (!this.initialFormData) return throwError(new Error('Invalid initial data'));
        const changes = this.getItemChanges();
        if (!changes) return throwError(new Error('Invalid form'));
        if (res) {
          // @TODO: Avoid affecting component vars in Observable Operator
          // save the new children (their ids) to prevent recreating them in case of error
          this.itemChanges.children = res;
          changes.children = res.map((child, idx) => ({ item_id: child.id, order: idx }));
        }
        if (!Object.keys(changes).length) return of(undefined);
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
      uses_api: item.usesApi || false,
      validation_type: item.validationType,
      no_score: item.noScore,
      title_bar_visible: item.titleBarVisible || false,
      prompt_to_join_group_by_code: item.promptToJoinGroupByCode || false,
      full_screen: item.fullScreen,
      allows_multiple_attempts: item.allowsMultipleAttempts,
      requires_explicit_entry: item.requiresExplicitEntry,
      durationOn: item.duration !== null,
      duration: item.duration,
      entering_time_min: new Date(item.enteringTimeMin),
      entering_time_max: new Date(item.enteringTimeMax),
    });

    this.itemChanges = {};
    this.itemForm.enable();
    this.editContent?.reset();
  }
}
