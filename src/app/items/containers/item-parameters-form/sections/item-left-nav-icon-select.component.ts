import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LEFT_NAV_ICON_OPTIONS } from 'src/app/items/models/left-nav-icons';

interface IconChoice {
  value: string,
  iconClass: string,
  ariaLabel: string,
}

@Component({
  selector: 'alg-item-left-nav-icon-select',
  templateUrl: './item-left-nav-icon-select.component.html',
  styleUrl: './item-left-nav-icon-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemLeftNavIconSelectComponent),
      multi: true,
    },
  ],
})
export class ItemLeftNavIconSelectComponent implements ControlValueAccessor {
  defaultIcon = input.required<string>();
  labelId = input.required<string>();

  value = signal('');

  readonly choices = computed((): IconChoice[] => {
    const defaultIcon = this.defaultIcon();
    const defaultChoice: IconChoice = {
      value: '',
      iconClass: `ph-${defaultIcon}`,
      ariaLabel: $localize`Default icon`,
    };
    const customChoices = LEFT_NAV_ICON_OPTIONS.map(icon => ({
      value: icon,
      iconClass: `ph-${icon}`,
      ariaLabel: iconAriaLabel(icon),
    }));
    return [ defaultChoice, ...customChoices ];
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  select(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const choices = this.choices();
    const nextIndex = nextIconChoiceIndex(event.key, index, choices.length);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const next = choices[nextIndex];
    if (next) {
      this.select(next.value);
      this.focusChoice(nextIndex);
    }
  }

  private focusChoice(index: number): void {
    const el = document.getElementById(this.choiceId(index));
    el?.focus();
  }

  choiceId(index: number): string {
    return `left-nav-icon-choice-${index}`;
  }

  isSelected(choiceValue: string): boolean {
    return this.value() === choiceValue;
  }
}

function iconAriaLabel(icon: string): string {
  return icon.replace(/-/g, ' ');
}

function nextIconChoiceIndex(key: string, index: number, length: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % length;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}
