import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: [ './input.component.scss' ],
})
export class InputComponent {
  @Input() name = ''; // name of the input in the parent form
  @Input() parentForm?: FormGroup;

  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() isDark = true;
  @Input() size: 'small' | 'large' = 'small';
  @Input() inputType = 'text';
  @Input() inputIcon = 'font'; // a font-awesome icon identifier
  @Input() buttonIcon?: string; // a font-awesome icon identifier for the input button
  @Input() hasClearButton = false;

  @Output() click = new EventEmitter();

  constructor() {}

  onButtonClick(): void {
    this.click.emit();
  }

  clearInput(): void {
    this.parentForm?.get(this.name)?.reset('');
  }
}
