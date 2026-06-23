
import { Component, effect, forwardRef, input, output, signal, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ensureDefined } from 'src/app/utils/assert';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

/**
 * To use inside form, just set the formControlName
 * ```
 * <alg-selection [items]="items" formControlName="mode"></alg-selection>
 * ```
 * Otherwise you can use the 'change' output and the 'selected' input for regular uses
 * ```
 * <alg-selection [items]="items" [selected]="initialIndex" (change)="onChange($event)"></alg-selection>
 * ```
 */
@Component({
  selector: 'alg-selection',
  templateUrl: './selection.component.html',
  styleUrl: './selection.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectionComponent),
      multi: true,
    }
  ],
  imports: [ TooltipDirective ],
})
export class SelectionComponent<T> implements ControlValueAccessor {
  items = input<{ label: string, value: T, icon?: string, tooltip?: string }[]>([]);
  selected = input(0);

  change = output<number>();

  protected readonly selectedIndex = signal(0);

  private onChange: (value: T) => void = () => {};
  private formBound = false;

  constructor() {
    // Replaces ngOnChanges validation for items / internal selection changes.
    // Throws in an effect (Angular error handler) rather than at the binding site — same
    // contract as before when a parent passes invalid items or an out-of-range index.
    effect(() => {
      const items = this.items();
      const index = untracked(() => this.selectedIndex());
      this.validateSelection(items, index);
    });

    effect(() => {
      const selected = this.selected();
      if (this.formBound) {
        return;
      }
      untracked(() => {
        this.validateSelection(this.items(), selected);
        this.selectedIndex.set(selected);
      });
    });
  }

  writeValue(value: T): void {
    const items = this.items();
    const index = items.findIndex(item => item.value === value);
    if (index === -1) throw Error('Invalid value set by form');
    this.selectedIndex.set(index);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.formBound = true;
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: T) => void): void {
  }

  itemChanged(index: number): void {
    const items = this.items();
    this.validateSelection(items, index);

    this.selectedIndex.set(index);
    this.change.emit(index);
    this.onChange(ensureDefined(items[index]).value);
  }

  private validateSelection(
    items: { label: string, value: T, icon?: string, tooltip?: string }[],
    selected: number,
  ): void {
    if (items.length === 0) throw Error('Invalid items');
    if (selected < 0 || selected >= items.length) throw Error('Invalid selected index');
  }
}
