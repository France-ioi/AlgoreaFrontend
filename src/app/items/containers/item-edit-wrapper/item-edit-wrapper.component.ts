import { Component, inject, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges } from '@angular/core';
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
import { GetItemByIdService, Item } from 'src/app/data-access/get-item-by-id.service';
import { concat, distinctUntilChanged, forkJoin, map, Observable, of, throwError, toArray } from 'rxjs';
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
  itemToParametersValue,
  sectionsForItemType,
} from 'src/app/items/models/item-parameters';
import { ItemChanges } from '../../data-access/update-item.service';
import { buildItemAllStringsChanges } from 'src/app/items/models/item-strings-changes';

import { fromItemContent } from '../../store';
import { Store } from '@ngrx/store';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { ItemAllStringsFormComponent } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.component';
import { APPCONFIG } from 'src/app/config';
import { DeleteItemStringService } from 'src/app/items/data-access/delete-item-string.service';

interface ServerValidationError extends HttpErrorResponse {
  error: {
    errors: ValidationErrors,
  },
}

function isServerValidationErrors(e: HttpErrorResponse): e is ServerValidationError {
  const errorBody: unknown = e.error;
  return errorBody !== null && typeof errorBody === 'object'
    && 'errors' in errorBody && errorBody.errors !== null && typeof errorBody.errors === 'object';
}

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
  private getItemByIdService = inject(GetItemByIdService);
  private formBuilder = inject(FormBuilder);
  private deleteItemStringService = inject(DeleteItemStringService);

  itemForm = this.formBuilder.nonNullable.group({
    allStrings: this.formBuilder.nonNullable.control<StringsValue[]>([], [ Validators.required, Validators.minLength(1) ]),
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

  supportedLanguages = signal(this.config.languages.map(lv => lv.tag));
  fetchingOtherLanguages = signal(false);
  initialLanguageValues = signal<StringsValue[]>([]);

  textIdError = signal<string | null>(null);

  constructor() {
    // Clear the server-side text_id error as soon as the user edits the field, matching the
    // behaviour of Angular's built-in validators. Without this, a stale 4xx error would linger
    // until the next save attempt or until the form is reset.
    // Teardown is wired via `takeUntilDestroyed()`; the returned Subscription is intentionally
    // dropped (constructor body is an injection context, so `takeUntilDestroyed()` still works).
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
    const prevId = (changes.itemData?.previousValue as ItemData | undefined)?.item.id;
    const currId = (changes.itemData?.currentValue as ItemData | undefined)?.item.id;
    if (!this.itemData || prevId === currId) return;

    this.setFormsDisabled(true);
    this.initialItem = this.itemData.item;
    this.initialParameters = itemToParametersValue(this.itemData.item);
    this.resetForm();
    this.initialLanguageValues.set([ toStringsValue(this.itemData.item) ]);
    this.resetStringsForm();
    this.fetchOtherLanguages(this.itemData.item);
  }

  ngOnDestroy(): void {
    this.pendingChangesService.clear();
  }

  isDirty(): boolean {
    return this.itemForm.dirty || this.imageUrlForm.dirty;
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

  private fetchOtherLanguages(mainItem: Item): void {
    if (this.fetchingOtherLanguages()) return;
    const languagesForFetch = mainItem.supportedLanguageTags.filter(langTag => langTag !== mainItem.string.languageTag);
    if (languagesForFetch.length === 0) return this.setFormsDisabled(false);
    this.fetchingOtherLanguages.set(true);
    const onSettled = (): void => {
      this.fetchingOtherLanguages.set(false);
      this.setFormsDisabled(false);
    };
    forkJoin(languagesForFetch.map(langTag => this.getItemByIdService.get(mainItem.id, { languageTag: langTag }))).subscribe({
      next: result => this.updateAllStringsFormValue(result),
      error: onSettled,
      complete: onSettled,
    });
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

  private buildStringsRequests(): { creates: Observable<void>[], updates: Observable<void>[], deletes: Observable<void>[] } {
    const id = this.itemData?.item.id;
    if (!id || !this.initialItem) throw new Error('Missing ID form');

    const stringsChanges = buildItemAllStringsChanges(
      this.itemForm.controls.allStrings.getRawValue(),
      this.initialLanguageValues(),
      this.itemForm.controls.defaultLanguageTag.getRawValue(),
      this.initialItem,
      this.imageUrlForm.controls.imageUrl.getRawValue(),
    );
    const initialLanguageTags = this.initialLanguageValues().map(v => v.languageTag);
    const stringLanguageTagsValue = this.itemForm.getRawValue().allStrings.map(v => v.languageTag);
    const stringsToRemove = this.initialLanguageValues().filter(v => !stringLanguageTagsValue.includes(v.languageTag));

    const creates: Observable<void>[] = [];
    const updates: Observable<void>[] = [];
    for (const { changes, languageTag } of stringsChanges) {
      const request = this.updateItemStringService.updateItem(id, changes, languageTag);
      if (initialLanguageTags.includes(languageTag)) updates.push(request);
      else creates.push(request);
    }

    return {
      creates,
      updates,
      deletes: stringsToRemove.map(v => this.deleteItemStringService.delete(id, v.languageTag)),
    };
  }

  save(): void {
    if (!this.initialItem) return;
    if (this.itemForm.invalid) {
      this.actionFeedbackService.error($localize`You need to solve all the errors displayed in the form to save changes.`);
      return;
    }
    const itemChanges = this.buildItemChanges();
    if (itemChanges === null) return;
    const { creates, updates, deletes } = this.buildStringsRequests();
    const trailingRequests = [ ...updates, ...deletes ];
    // Skip the network round-trip and the "saved" toast when nothing actually changed; the Save
    // button is gated by `dirty` so this is mostly a defensive guard.
    if (!Object.keys(itemChanges).length && creates.length === 0 && trailingRequests.length === 0) return;
    // Order matters and is driven by the item ↔ item-strings dependency:
    // 1. Create new item-strings first, so `default_language_tag` on the item can safely point at
    //    a freshly-added language.
    // 2. Update the item record (which may change `default_language_tag`).
    // 3. Run remaining updates and deletes in parallel — running deletes AFTER the item update
    //    also lets the user demote-then-delete the previous default language in a single save.
    const requests$ = [
      ...(creates.length > 0 ? [ forkJoin(creates) ] : []),
      this.updateItem(itemChanges),
      ...(trailingRequests.length > 0 ? [ forkJoin(trailingRequests) ] : []),
    ];

    this.setFormsDisabled(true);
    concat(...requests$).pipe(toArray()).subscribe({
      next: () => {
        this.setFormsDisabled(false);
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
        this.store.dispatch(fromItemContent.itemByIdPageActions.refresh()); // which will re-enable the form
        this.currentContentService.forceNavMenuReload();
      },
      error: (err: unknown) => this.onSaveError(err),
    });
  }

  private onSaveError(err: unknown): void {
    this.setFormsDisabled(false);
    if (err instanceof HttpErrorResponse && isServerValidationErrors(err)) {
      this.itemForm.setErrors(err.error.errors);
      this.textIdError.set(extractTextIdError(err.error.errors));
      return;
    }
    this.actionFeedbackService.unexpectedError();
    if (!(err instanceof HttpErrorResponse)) throw err;
  }

  onCancel(): void {
    this.resetForm();
    this.resetStringsForm();
  }

  onConfirmRemoval(): void {
    this.resetForm();
    this.resetStringsForm();
  }

  private updateAllStringsFormValue(items: Item[]): void {
    const [ mainLanguageStringsValue ] = this.itemForm.controls.allStrings.getRawValue();
    if (!mainLanguageStringsValue) throw new Error('Unexpected: Missed mainLanguageStringsValue');
    const values = items.map(toStringsValue);
    const isDirty = this.itemForm.controls.allStrings.dirty;
    this.initialLanguageValues.update(initialValues => ([ ...initialValues, ...values ]));
    if (!isDirty) {
      this.resetStringsForm();
      return;
    }
    this.itemForm.controls.allStrings.setValue([ mainLanguageStringsValue, ...values ]);
    this.resetImageUrl();
    this.itemForm.controls.allStrings.markAsDirty();
  }

  private resetStringsForm(): void {
    this.itemForm.controls.allStrings.reset(this.initialLanguageValues());
    this.resetImageUrl();
  }

  private resetImageUrl(): void {
    if (!this.initialItem) throw new Error('Unexpected: Missed initial form data');
    const imageUrl = this.initialLanguageValues().find(l => l.languageTag === this.initialItem!.defaultLanguageTag)?.imageUrl;
    this.imageUrlForm.reset({ imageUrl: imageUrl || '' });
  }

  private resetForm(): void {
    if (!this.initialItem || !this.initialParameters) return;
    this.itemForm.reset({ defaultLanguageTag: this.initialItem.defaultLanguageTag, parameters: this.initialParameters });
    this.textIdError.set(null);
  }

  onDefaultLanguageChange(languageTag: string): void {
    this.itemForm.controls.defaultLanguageTag.setValue(languageTag);
    this.itemForm.controls.defaultLanguageTag.markAsDirty();
  }
}

function extractTextIdError(errors: ValidationErrors): string | null {
  const raw: unknown = errors.text_id;
  if (Array.isArray(raw)) return raw.join(' ');
  if (typeof raw === 'string') return raw;
  return null;
}

function toStringsValue(item: Pick<Item, 'string'>): StringsValue {
  return {
    languageTag: item.string.languageTag || '',
    title: item.string.title || '',
    subtitle: item.string.subtitle || '',
    description: item.string.description || '',
    imageUrl: item.string.imageUrl || '',
  };
}
