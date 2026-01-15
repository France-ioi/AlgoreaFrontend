
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ensureDefined } from 'src/app/utils/assert';
import { NgClass } from '@angular/common';
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
  styleUrls: [ './selection.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectionComponent),
      multi: true,
    }
  ],
  imports: [ NgClass, TooltipDirective ]
})
export class SelectionComponent<T> implements OnChanges, ControlValueAccessor {
  @Input() items: { label: string, value: T, icon?: string, tooltip?: string }[] = [];
  @Input() selected = 0;
  @Input() mode: 'light' | 'dark' | 'basic' = 'light';

  @Output() change = new EventEmitter<number>();

  private onChange: (value: T) => void = () => {};

  ngOnChanges(_simpleChanges: SimpleChanges): void {
    if (this.items.length === 0) throw Error('Invalid items');
    if (this.selected < 0 || this.selected >= this.items.length) throw Error('Invalid selected index');
  }

  writeValue(value: T): void {
    const index = this.items.findIndex(item => item.value === value);
    if (index === -1) throw Error('Invalid value set by form');
    this.selected = index;
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: T) => void): void {
  }

  itemChanged(index: number): void {
    if (index < 0 || index >= this.items.length) throw Error('Invalid index');

    this.selected = index;
    this.change.emit(this.selected);
    this.onChange(ensureDefined(this.items[this.selected]).value);
  }
}
