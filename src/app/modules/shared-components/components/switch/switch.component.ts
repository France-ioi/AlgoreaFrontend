import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-switch',
  templateUrl: './switch.component.html',
  styleUrls: [ './switch.component.scss' ],
})
export class SwitchComponent implements OnInit {
  @Input() checked = false;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

  @Input() parentForm?: FormGroup;
  @Input() name = '';
  formControl?: FormControl;

  @Output() change = new EventEmitter<boolean>();

  ngOnInit(): void {
    if (this.parentForm && this.parentForm.get(this.name)) {
      this.formControl = this.parentForm.get(this.name) as FormControl;
    }
  }

  handleChange(checked: boolean): void {
    this.change.emit(checked);
  }
}
