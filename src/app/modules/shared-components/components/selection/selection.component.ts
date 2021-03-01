
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-selection',
  templateUrl: './selection.component.html',
  styleUrls: [ './selection.component.scss' ],
})
export class SelectionComponent implements OnChanges, OnDestroy {
  @Input() type: 'rounded' | 'square' = 'rounded';
  @Input() items: { label: string, value: string | boolean | number, icon?: string }[] = [];
  @Input() selected = 0;
  @Input() mode: 'light' | 'dark' | 'basic' = 'light';

  @Output() change = new EventEmitter<number>();

  @Input() parentForm?: FormGroup;
  @Input() name = '';
  private formControlChangesSubscription?: Subscription;

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (
      Object.prototype.hasOwnProperty.call(simpleChanges, 'parentForm')
      || Object.prototype.hasOwnProperty.call(simpleChanges, 'items')
      || Object.prototype.hasOwnProperty.call(simpleChanges, 'name')
    ) {
      if (!this.parentForm) throw Error('Invalid parent form');
      if (!this.name) throw Error('Invalid form control name');
      if (!this.items.length) throw Error('Invalid items');

      if (Object.prototype.hasOwnProperty.call(simpleChanges, 'parentForm')) {
        this.formControlChangesSubscription?.unsubscribe();
        const formControl = this.parentForm.get(this.name);
        if (formControl === null) throw new Error('Form control inaccessible');
        this.formControlChangesSubscription = formControl.valueChanges.subscribe(value => {
          const index = this.items.findIndex(item => item.value === value);
          this.selected = index !== -1 ? index : 0;
        });
      }
    }
  }

  itemChanged(index: number): void {
    if (this.parentForm) {
      const formControl = this.parentForm.get(this.name);
      if (formControl === null) throw Error('Form control inaccessible');
      formControl.setValue(this.items[index].value);
      this.parentForm.markAsDirty();
    } else {
      this.change.emit(index);
    }
    this.selected = index;
  }

  ngOnDestroy(): void {
    this.formControlChangesSubscription?.unsubscribe();
  }
}
