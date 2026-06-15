import { Component, forwardRef, inject, input } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors,
} from '@angular/forms';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemEditContentComponent } from 'src/app/items/containers/item-edit-content/item-edit-content.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { stringsValueEqual } from 'src/app/items/containers/item-strings-form-group/item-all-strings-form.helpers';
import { createCvaEcho } from 'src/app/utils/cva-echo';
import {
  stringsLanguageTagValidators,
  stringsSubtitleValidators,
  stringsTitleValidators,
} from 'src/app/items/containers/item-strings-form-group/item-strings-validators';

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
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Angular host CSS class binding
    '[class.pending-deletion]': 'pendingDeletion()',
  },
  imports: [
    InputComponent,
    ItemEditContentComponent,
    TooltipDirective,
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
  ]
})
export class ItemStringsControlComponent implements ControlValueAccessor {
  showDescription = input(false);
  pendingDeletion = input(false);

  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    languageTag: [ '', stringsLanguageTagValidators ],
    title: [ '', stringsTitleValidators ],
    subtitle: [ '', stringsSubtitleValidators ],
    description: [ '' ],
  });

  // Propagate the inner form value to the parent CVA synchronously so that
  // the parent control is marked dirty within the same change-detection turn
  // as the user input. Going through an effect() would defer the dirty
  // propagation to the post-CD effect-flush phase, causing
  // ExpressionChangedAfterItHasBeenChecked (NG0100) on bindings up the tree
  // that depend on the parent form's `dirty` state.
  private outboundEcho = createCvaEcho(stringsValueEqual);

  private valueChangesSub = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      this.outboundEcho.emitIfChanged(this.form.getRawValue(), v => this.onChange(v));
    });

  writeValue(value: StringsValue | null): void {
    if (value) {
      this.outboundEcho.rememberInbound(value);
      this.form.patchValue(value, { emitEvent: false });
      // Re-emit validity so alg-input-error (statusChanges subscription) refreshes after silent
      // patches when switching language tabs in item-all-strings-form.
      this.form.updateValueAndValidity({ emitEvent: true });
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

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }
}
