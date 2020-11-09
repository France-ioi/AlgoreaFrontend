import { Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input-error',
  templateUrl: './form-error.component.html',
  styleUrls: [ './form-error.component.scss' ],
})
export class FormErrorComponent implements OnChanges {
  @Input() form?: FormGroup;
  @Input() inputName = '';

  control?: AbstractControl;

  constructor() {
  }

  ngOnChanges(): void {
    const control = this.form?.get(this.inputName);
    if (control === null) return;
    this.control = control;
  }

}
