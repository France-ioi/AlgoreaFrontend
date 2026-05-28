import {
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ItemData } from '../../models/item-data';
import {
  ValidationErrors,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { UpdateItemService } from '../../data-access/update-item.service';
import { UpdateItemStringService } from '../../data-access/update-item-string.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { distinctUntilChanged, map, Observable, of, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { PendingChangesComponent } from 'src/app/guards/pending-changes-guard';
import { PendingChangesService } from 'src/app/services/pending-changes-service';
import { AllowsEditingAllItemPipe } from 'src/app/items/models/item-edit-permission';
import { FloatingSaveComponent } from 'src/app/ui-components/floating-save/floating-save.component';
import { ItemParametersFormComponent } from '../item-parameters-form/item-parameters-form.component';
import {
  buildItemParametersChanges,
  ItemParametersValue,
  sectionsForItemType,
} from 'src/app/items/models/item-parameters';
import { ItemChanges } from '../../data-access/update-item.service';
import { fromItemContent } from '../../store';
import { Store } from '@ngrx/store';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ItemAllStringsFormComponent } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.component';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { AllStringsFormValue } from 'src/app/items/containers/item-strings-form-group/all-strings-form-value';
import { shouldResyncStringsBaseline } from './item-edit-wrapper-sync';
import { APPCONFIG } from 'src/app/config';
import { DeleteItemStringService } from 'src/app/items/data-access/delete-item-string.service';
import {
  createItemEditSnapshot,
  resetItemEditForms,
  syncFormStateAfterSave,
} from './item-edit-wrapper-form-state';
import { runItemEditSave } from './item-edit-wrapper-save-flow';

@Component({
  selector: 'alg-item-edit-wrapper',
  templateUrl: './item-edit-wrapper.component.html',
  styleUrls: [ './item-edit-wrapper.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ItemParametersFormComponent,
    FloatingSaveComponent,
    AllowsEditingAllItemPipe,
    ErrorComponent,
    ItemAllStringsFormComponent,
  ]
})
export class ItemEditWrapperComponent implements OnInit, OnChanges, OnDestroy, PendingChangesComponent {
  @Input() itemData?: ItemData;

  private store = inject(Store);
  private currentContentService = inject(CurrentContentService);
  private updateItemService = inject(UpdateItemService);
  private updateItemStringService = inject(UpdateItemStringService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private pendingChangesService = inject(PendingChangesService);
  private config = inject(APPCONFIG);
  private formBuilder = inject(FormBuilder);
  private deleteItemStringService = inject(DeleteItemStringService);

  itemForm = this.formBuilder.nonNullable.group({
    allStrings: this.formBuilder.nonNullable.control<AllStringsFormValue>(
      { strings: [], pendingDeletions: [] },
      [ Validators.required ],
    ),
    defaultLanguageTag: this.formBuilder.nonNullable.control(''),
    parameters: this.formBuilder.control<ItemParametersValue | null>(null),
  });

  /**
   * `imageUrl` is rendered inside the parameters Display section but, server-side, lives on the
   * default-language item string — so it's owned here (next to the strings form). A small
   * single-control group keeps the `alg-input` API (which expects a parent FormGroup) happy.
   */
  imageUrlForm = this.formBuilder.nonNullable.group({
    imageUrl: [ '', Validators.maxLength(2000) ],
  });

  initialItem?: Item;
  initialParameters?: ItemParametersValue;
  private persistedImageUrl = '';

  supportedLanguages = signal(this.config.languages.map(lv => lv.tag));
  initialLanguageValues = signal<StringsValue[]>([]);
  loadedLanguageTags = computed(() => this.initialLanguageValues().map(v => v.languageTag));

  textIdError = signal<string | null>(null);

  constructor() {
    this.itemForm.controls.parameters.valueChanges
      .pipe(
        map(v => v?.textId ?? null),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.textIdError.set(null));
  }

  ngOnInit(): void {
    this.pendingChangesService.set(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.itemData) return;
    const itemChange = changes.itemData;
    if (!itemChange) return;

    const prevItem = (itemChange.previousValue as ItemData | undefined)?.item;
    const currItem = (itemChange.currentValue as ItemData).item;
    const idChanged = prevItem?.id !== currItem.id;

    if (idChanged) {
      this.applyFullItemSnapshot(currItem);
      return;
    }

    if (shouldResyncStringsBaseline(prevItem, currItem)) {
      this.resyncServerBaseline(currItem);
    }
  }

  ngOnDestroy(): void {
    this.pendingChangesService.clear();
  }

  isDirty(): boolean {
    return this.itemForm.dirty || this.imageUrlForm.dirty;
  }

  onLanguageValueLoaded(value: StringsValue): void {
    if (this.initialLanguageValues().some(v => v.languageTag === value.languageTag)) return;
    this.initialLanguageValues.update(initialValues => [ ...initialValues, value ]);
  }

  save(): void {
    if (!this.initialItem) return;
    if (this.itemForm.invalid || this.imageUrlForm.invalid) {
      this.actionFeedbackService.error($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }
    const itemChanges = this.buildItemChanges();
    if (itemChanges === null) return;
    const id = this.itemData?.item.id;
    if (!id) throw new Error('Missing ID form');

    runItemEditSave({
      itemId: id,
      initialItem: this.initialItem,
      getAllStrings: () => this.itemForm.controls.allStrings.getRawValue(),
      getDefaultLanguageTag: () => this.itemForm.controls.defaultLanguageTag.getRawValue(),
      getImageUrl: () => this.imageUrlForm.controls.imageUrl.getRawValue(),
      persistedImageUrl: this.persistedImageUrl,
      initialLanguageValues: this.initialLanguageValues(),
      serverSupportedLanguageTags: this.itemData?.item.supportedLanguageTags ?? [],
      itemChanges,
      updateItem: changes => this.updateItem(changes),
      updateItemStringService: this.updateItemStringService,
      deleteItemStringService: this.deleteItemStringService,
      actionFeedbackService: this.actionFeedbackService,
      setFormsDisabled: disabled => this.setFormsDisabled(disabled),
      onSaveSuccess: kind => {
        this.syncFormStateAfterSave();
        if (kind === 'server') {
          this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
          this.currentContentService.forceNavMenuReload();
        }
      },
      onValidationError: errors => {
        this.itemForm.setErrors(errors);
        this.textIdError.set(extractTextIdError(errors));
      },
      onUnexpectedError: err => {
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  onCancel(): void {
    this.resetAllFormValues();
    this.markFormsPristine();
  }

  onConfirmRemoval(): void {
    this.resetAllFormValues();
    this.markFormsPristine();
  }

  onDefaultLanguageChange(languageTag: string): void {
    this.itemForm.controls.defaultLanguageTag.setValue(languageTag);
    this.itemForm.controls.defaultLanguageTag.markAsDirty();
  }

  private buildItemChanges(): ItemChanges | null {
    if (!this.initialItem || !this.initialParameters) return null;
    const currentParameters = this.itemForm.controls.parameters.getRawValue();
    if (!currentParameters) return null;

    const changes = buildItemParametersChanges(
      currentParameters,
      this.initialParameters,
      sectionsForItemType(this.initialItem.type),
      this.initialItem.displaySettings,
    );
    const defaultLanguageTag = this.itemForm.controls.defaultLanguageTag.getRawValue();
    if (defaultLanguageTag !== this.initialItem.defaultLanguageTag) changes.default_language_tag = defaultLanguageTag;
    return changes;
  }

  private updateItem(changes: ItemChanges): Observable<void> {
    if (!this.initialItem) return throwError(() => new Error('Invalid initial data'));
    if (!Object.keys(changes).length) return of(undefined);
    return this.updateItemService.updateItem(this.initialItem.id, changes);
  }

  private setFormsDisabled(disabled: boolean): void {
    if (disabled) {
      this.itemForm.disable();
      this.imageUrlForm.disable();
    } else {
      this.itemForm.enable();
      this.imageUrlForm.enable();
    }
  }

  private applyFullItemSnapshot(item: Item): void {
    const snapshot = createItemEditSnapshot(item);
    this.applyEditSnapshot(snapshot);
    this.resetAllFormValues();
    this.markFormsPristine();
  }

  private resyncServerBaseline(item: Item): void {
    const snapshot = createItemEditSnapshot(item);
    this.applyEditSnapshot(snapshot);
    if (!this.isDirty()) {
      this.resetAllFormValues();
      this.markFormsPristine();
    }
  }

  private applyEditSnapshot(snapshot: ReturnType<typeof createItemEditSnapshot>): void {
    this.initialItem = snapshot.initialItem;
    this.initialParameters = snapshot.initialParameters;
    this.initialLanguageValues.set(snapshot.initialLanguageValues);
    this.persistedImageUrl = snapshot.persistedImageUrl;
  }

  private resetAllFormValues(): void {
    if (!this.initialItem || !this.initialParameters) return;
    resetItemEditForms(
      { itemForm: this.itemForm, imageUrlForm: this.imageUrlForm },
      {
        initialItem: this.initialItem,
        initialParameters: this.initialParameters,
        initialLanguageValues: this.initialLanguageValues(),
        persistedImageUrl: this.persistedImageUrl,
      },
    );
    this.textIdError.set(null);
  }

  private syncFormStateAfterSave(): void {
    syncFormStateAfterSave(
      { itemForm: this.itemForm, imageUrlForm: this.imageUrlForm },
      this.itemData?.item.supportedLanguageTags ?? [],
      values => this.initialLanguageValues.set(values),
    );
    this.persistedImageUrl = this.imageUrlForm.controls.imageUrl.getRawValue();
  }

  private markFormsPristine(): void {
    this.itemForm.markAsPristine();
    this.imageUrlForm.markAsPristine();
  }
}

function extractTextIdError(errors: ValidationErrors): string | null {
  const raw: unknown = errors.text_id;
  if (Array.isArray(raw)) return raw.join(' ');
  if (typeof raw === 'string') return raw;
  return null;
}
