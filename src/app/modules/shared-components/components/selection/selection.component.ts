
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
  private subscriptions: Subscription[] = [];

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (Object.prototype.hasOwnProperty.call(simpleChanges, 'parentForm') && this.parentForm && this.items.length) {
      const formControl = this.parentForm.get(this.name);

      if (formControl !== null) {
        this.subscriptions.push(formControl.valueChanges.subscribe(value => {
          const index = this.items.findIndex(item => item.value === value);
          if (index !== -1) this.selected = index;
        }));
      }
    }
  }

  itemChanged(index: number): void {
    if (this.parentForm && this.parentForm.get(this.name)) {
      this.parentForm.get(this.name)?.setValue(this.items[index].value);
      this.parentForm.markAsDirty();
    } else {
      this.change.emit(index);
    }
    this.selected = index;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
