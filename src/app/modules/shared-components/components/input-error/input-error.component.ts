import { Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input-error',
  templateUrl: './input-error.component.html',
  styleUrls: [ './input-error.component.scss' ],
})
export class InputErrorComponent implements OnChanges {
  @Input() form?: FormGroup;
  @Input() inputName = '';

  control?: AbstractControl;

  constructor() {
  }

  ngOnChanges(): void {
    const elm = this.form?.get(this.inputName);
    if (!elm) return;
    this.control = elm;
  }

}
