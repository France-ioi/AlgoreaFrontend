import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

/**
 * If you set parentForm it will handle the value as a usual reactive form
 * so it will not emit anything on change
 */
@Component({
  selector: 'alg-switch',
  templateUrl: './switch.component.html',
  styleUrls: [ './switch.component.scss' ],
})
export class SwitchComponent implements OnChanges {
  @Input() checked = false;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

  @Input() parentForm?: FormGroup;
  @Input() name = '';
  formControl?: FormControl;

  @Output() change = new EventEmitter<boolean>();

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.prototype.hasOwnProperty.call(changes, 'parentForm') && this.parentForm && this.parentForm.get(this.name)) {
      this.formControl = this.parentForm.get(this.name) as FormControl;
    }
  }

  handleChange(checked: boolean): void {
    this.change.emit(checked);
  }
}
