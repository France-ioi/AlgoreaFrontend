import { Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  countDigitsBeforeIndex,
  formatMaskValue,
  parseMaskPattern,
  ParsedMask,
  selectionIndexAfterDigits,
} from './mask.utils';

@Directive({
  selector: 'input[algMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MaskDirective),
      multi: true,
    },
  ],
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Angular host event binding
    '(input)': 'onInput($event)',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Angular host event binding
    '(blur)': 'onBlur()',
  },
})
export class MaskDirective implements ControlValueAccessor {
  private elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  algMask = input.required<string>();
  suffix = input('');
  clearIfNotMatch = input(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  // Setting input.value does not fire 'input'; kept in case future code dispatches events during writeValue.
  private writingValue = false;
  private modelValue = '';

  writeValue(value: unknown): void {
    this.writingValue = true;
    const parsed = this.getParsedMask();
    const incoming = this.toModelString(value);
    const formatted = formatMaskValue(incoming, parsed);
    this.modelValue = formatted;
    this.updateElementValue(this.modelValue, parsed);
    // Reactive-form writes may pass raw digits (e.g. from an API); propagate the formatted
    // model so the control matches what the user sees. Template-mask parents like alg-input-date
    // already pass formatted strings via convertDateToString, so this is usually a no-op there.
    if (formatted !== incoming) {
      this.onChange(formatted);
    }
    this.writingValue = false;
  }

  private toModelString(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  onInput(event: Event): void {
    if (this.writingValue) {
      return;
    }

    const inputElement = event.target as HTMLInputElement;
    const parsed = this.getParsedMask();
    const cursorStart = inputElement.selectionStart;
    const rawValue = this.stripSuffix(inputElement.value);
    this.modelValue = formatMaskValue(rawValue, parsed);
    this.updateElementValue(this.modelValue, parsed, cursorStart);
    this.onChange(this.modelValue);
  }

  onBlur(): void {
    const parsed = this.getParsedMask();
    // clearIfNotMatch only applies to template masks; numeric alternation masks (duration fields)
    // accept any length up to maxDigits, so partial input is already valid and needs no clearing.
    if (this.clearIfNotMatch() && parsed.mode === 'template' && this.modelValue.length !== parsed.template.length) {
      this.modelValue = '';
      this.updateElementValue('', parsed);
      this.onChange('');
    }
    this.onTouched();
  }

  private getParsedMask(): ParsedMask {
    return parseMaskPattern(this.algMask());
  }

  private stripSuffix(value: string): string {
    const suffix = this.suffix();
    if (!suffix || !value.endsWith(suffix)) {
      return value;
    }
    return value.slice(0, -suffix.length);
  }

  private updateElementValue(modelValue: string, parsed: ParsedMask, selectionStart?: number | null): void {
    const inputElement = this.elementRef.nativeElement;
    const displayValue = this.toDisplayValue(modelValue, parsed);
    const previousValue = inputElement.value;

    inputElement.value = displayValue;

    if (selectionStart === null || selectionStart === undefined) {
      return;
    }

    const editablePart = parsed.mode === 'numeric' && this.suffix() ? modelValue : displayValue;
    const digitsBefore = countDigitsBeforeIndex(this.stripSuffix(previousValue), selectionStart);
    const newCursor = selectionIndexAfterDigits(editablePart, digitsBefore);
    inputElement.setSelectionRange(newCursor, newCursor);
  }

  private toDisplayValue(modelValue: string, parsed: ParsedMask): string {
    if (parsed.mode === 'numeric' && this.suffix()) {
      return `${modelValue}${this.suffix()}`;
    }
    return modelValue;
  }
}
