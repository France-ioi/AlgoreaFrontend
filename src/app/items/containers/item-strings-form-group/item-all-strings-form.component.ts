import { Component, DestroyRef, forwardRef, inject, input, output, signal, viewChildren } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {
  ItemStringsControlComponent,
  StringsValue
} from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';


@Component({
  selector: 'alg-item-all-strings-form',
  templateUrl: './item-all-strings-form.component.html',
  styleUrls: [ './item-all-strings-form.component.scss' ],
  imports: [
    ItemStringsControlComponent,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    ButtonIconComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemAllStringsFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemAllStringsFormComponent),
      multi: true,
    },
  ]
})
export class ItemAllStringsFormComponent implements Validator {
  allStringControls = viewChildren(ItemStringsControlComponent);
  defaultLanguageEvent = output<string>();
  defaultLanguageTag = input<string>();
  supportedLanguages = input.required<string[]>();
  showDescription = input(false);
  fetchingOtherLanguages = input(false);

  private fb = inject(FormBuilder);
  private pendingRevalidationTimer: ReturnType<typeof setTimeout> | undefined;

  // Cleanup must be registered once at construction. Angular Forms calls
  // `registerOnValidatorChange` more than once (notably during teardown via
  // cleanUpValidators with a noop), and registering `destroyRef.onDestroy`
  // inside it would throw NG0911 on the destruction-time call because the
  // view is already being destroyed.
  private timerCleanup = inject(DestroyRef).onDestroy(() => {
    if (this.pendingRevalidationTimer !== undefined) clearTimeout(this.pendingRevalidationTimer);
  });

  form = this.fb.group({
    allStrings: this.fb.nonNullable.array([
      this.fb.nonNullable.control({
        languageTag: '',
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
      }),
    ]),
  });
  availableLanguagesToCreate = signal<string[] | undefined>(undefined);

  // Propagate the inner form value to the parent CVA synchronously (rather
  // than via an effect()) so that the parent control is marked dirty during
  // the same change-detection turn as the user interaction. Going through an
  // effect would defer the markAsDirty to the post-CD effect-flush phase,
  // causing `itemForm.dirty` to flip between the main check and dev-mode
  // checkNoChanges (NG0100 ExpressionChangedAfterItHasBeenChecked on the
  // wrapper's `@if (itemForm.dirty)`).
  private valueChangesSub = this.form.controls.allStrings.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      const value = this.form.controls.allStrings.getRawValue();
      if (value.length > 0) {
        this.onChange(value);
      }
    });

  get allStrings(): FormArray<FormControl<StringsValue>> {
    return this.form.controls.allStrings;
  }

  writeValue(values: StringsValue[] | null): void {
    if (values) {
      if (values.length < this.form.controls.allStrings.length) {
        for (let i = this.form.controls.allStrings.length; i > values.length; i--) {
          this.removeStringsControl(i, { emitEvent: false });
        }
      }

      values.slice(this.form.controls.allStrings.length).forEach(() => {
        this.addStringsControl();
      });

      this.form.reset({ allStrings: values }, { emitEvent: false });

      this.determinateAvailableLanguagesToCreate();
    }
  }

  validate(): ValidationErrors | null {
    return (this.form.invalid || this.allStringControls().some(c => c.form.invalid))
      ? { allStringsForm: true }
      : null;
  }

  private onChange: (value: StringsValue[] | null) => void = () => {};
  private onValidatorChange: () => void = () => {};

  registerOnChange(fn: (value: StringsValue[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: StringsValue[] | null) => void): void {
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // After adding/removing a language card, the per-language `<alg-item-strings-control>`
  // child component (CVA + Validator) only mounts/unmounts on the next CD, so the new
  // FormControl<StringsValue>'s validators wire up after this method returns. We schedule
  // a re-validation via the macrotask queue so it runs after CD has wired/torn-down those
  // validators; otherwise the parent FormControl<StringsValue[]>'s `validate()` would have
  // run too early (against an unvalidated array) and the parent would stay valid even when
  // the inner form is invalid (e.g., a freshly added language with no title).
  private scheduleRevalidation(): void {
    if (this.pendingRevalidationTimer !== undefined) clearTimeout(this.pendingRevalidationTimer);
    this.pendingRevalidationTimer = setTimeout(() => {
      this.pendingRevalidationTimer = undefined;
      this.onValidatorChange();
    });
  }

  onSetDefaultLanguage(languageTag: string): void {
    this.defaultLanguageEvent.emit(languageTag);
  }

  addStringsControl(value?: Partial<StringsValue>): void {
    this.allStrings.push(
      this.fb.nonNullable.control({
        languageTag: '',
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        ...value,
      }),
      { emitEvent: value !== undefined },
    );
    this.scheduleRevalidation();
  }

  onAddStringsControl(value?: Partial<StringsValue>): void {
    this.addStringsControl(value);
    this.determinateAvailableLanguagesToCreate();
  }

  removeStringsControl(idx: number, options: { emitEvent: boolean } = { emitEvent: true }): void {
    this.form.controls.allStrings.removeAt(idx, options);
    this.scheduleRevalidation();
  }

  onRemoveStringsControl(idx: number): void {
    this.removeStringsControl(idx);
    this.determinateAvailableLanguagesToCreate();
  }

  determinateAvailableLanguagesToCreate(): void {
    const stringValues = this.form.controls.allStrings.getRawValue();
    this.availableLanguagesToCreate.set(
      this.supportedLanguages().filter(sl => !stringValues.find(v => v.languageTag === sl))
    );
  }
}
