import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ]
})
export class ItemEditContentComponent {
  @Input() inputName = '';
  @Input() parentForm?: FormGroup;

  value = '';

  constructor() {
    this.value = this.parentForm?.get(this.inputName)?.value as string;
  }

  updateForm(value: string): void {
    const input = this.parentForm?.get(this.inputName);
    input?.setValue(value);
  }

}
