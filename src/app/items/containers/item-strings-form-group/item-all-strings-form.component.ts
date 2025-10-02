import { Component, effect, forwardRef, inject, input, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors
} from '@angular/forms';
import {
  ItemStringsControlComponent,
  StringsValue
} from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';


@Component({
  selector: 'alg-item-all-strings-form',
  templateUrl: './item-all-strings-form.component.html',
  styleUrls: [ './item-all-strings-form.component.scss' ],
  standalone: true,
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
  ],
})
export class ItemAllStringsFormComponent {
  defaultLanguageTag = input<string>();
  supportedLanguages = input.required<string[]>();
  showDescription = input(false);
  fetchingOtherLanguages = input(false);

  private fb = inject(FormBuilder);

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
  formValue = toSignal(
    this.form.controls.allStrings.valueChanges.pipe(
      map(() => this.form.controls.allStrings.getRawValue()),
    ), { initialValue: [] }
  );
  availableLanguagesToCreate = signal<string[] | undefined>(undefined);

  emitValueEffect = effect(() => {
    const formValue = this.formValue();
    if (formValue.length > 0) {
      this.onChange(formValue);
    }
  });

  get allStrings(): FormArray<FormControl<StringsValue>> {
    return this.form.controls.allStrings;
  }

  writeValue(values: StringsValue[] | null): void {
    if (values) {
      if (values.length < this.form.controls.allStrings.length) {
        for (let i = this.form.controls.allStrings.length; i > values.length; i--) {
          this.form.controls.allStrings.removeAt(i, { emitEvent: false });
        }
      }

      values.slice(this.form.controls.allStrings.length).forEach(() => {
        this.addStringsControl();
      });

      this.form.reset({ allStrings: values }, { emitEvent: false });

      this.availableLanguagesToCreate.set(
        this.supportedLanguages().filter(sl => !values.find(v => v.languageTag === sl))
      );
    }
  }

  validate(): ValidationErrors | null {
    return this.form.valid ? null : { allStringsForm: true };
  }

  private onChange: (value: StringsValue[] | null) => void = () => {};

  registerOnChange(fn: (value: StringsValue[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: StringsValue[] | null) => void): void {
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
      }), { emitEvent: value !== undefined });

    this.availableLanguagesToCreate.set(
      this.supportedLanguages().filter(sl => !this.formValue().find(v => v.languageTag === sl))
    );
  }

  removeStringsControl(idx: number): void {
    this.form.controls.allStrings.removeAt(idx);
  }
}
