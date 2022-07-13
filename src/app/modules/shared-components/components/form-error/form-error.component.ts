import { Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input-error',
  templateUrl: './form-error.component.html',
  styleUrls: [ './form-error.component.scss' ],
})
export class FormErrorComponent implements OnChanges {
  @Input() form?: UntypedFormGroup;
  @Input() inputName = '';
  @Input() control?: AbstractControl;

  constructor() {
  }

  ngOnChanges(): void {
    if (!this.control && this.form && this.inputName) {
      this.control = this.form.get(this.inputName) ?? undefined;
    }
  }

}
