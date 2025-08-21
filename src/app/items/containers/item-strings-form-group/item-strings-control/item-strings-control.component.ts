import { Component, effect, forwardRef, inject, input } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors,
  Validators
} from '@angular/forms';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { ItemEditContentComponent } from 'src/app/items/containers/item-edit-content/item-edit-content.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export interface StringsValue {
  languageTag: string,
  title: string,
  subtitle: string,
  description: string,
}

@Component({
  selector: 'alg-item-strings-control',
  templateUrl: './item-strings-control.component.html',
  styleUrls: [ './item-strings-control.component.scss' ],
  standalone: true,
  imports: [
    InputComponent,
    ItemEditContentComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemStringsControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ItemStringsControlComponent),
      multi: true,
    },
  ],
})
export class ItemStringsControlComponent implements ControlValueAccessor {
  showDescription = input(false);

  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    languageTag: [ '', [ Validators.required ] ],
    title: [ '', [ Validators.required, Validators.minLength(3) ] ],
    subtitle: [ '', Validators.maxLength(200) ],
    description: [ '' ],
  });

  formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue()))
  );

  emitValueEffect = effect(() => {
    const formValue = this.formValue();
    if (formValue) {
      this.onChange(formValue);
    }
  });

  writeValue(value: StringsValue | null): void {
    if (value) {
      this.form.patchValue(value, { emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    return this.form.valid ? null : { stringsForm: true };
  }

  private onChange: (value: StringsValue | null) => void = () => {};

  registerOnChange(fn: (value: StringsValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: StringsValue | null) => void): void {
  }
}
