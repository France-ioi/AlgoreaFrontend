import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: [ './input.component.scss' ],
})
export class InputComponent {
  @Input() name = ''; // name of the input in the parent form
  @Input() parentForm?: UntypedFormGroup;

  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() isDark = true;
  @Input() size: 'small' | 'large' = 'small';
  @Input() inputType = 'text';
  @Input() inputIcon = 'fa fa-font';
  @Input() buttonIcon?: string; // a font-awesome icon identifier for the input button
  @Input() hasClearButton = false;

  @Input() pTooltip = '';
  @Input() tooltipEvent = 'hover';
  @Input() tooltipPosition = 'right';
  @Input() tooltipDisabled = false;

  @Output() click = new EventEmitter<void>();
  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();

  constructor() {
  }

  onButtonClick(): void {
    this.click.emit();
  }

  clearInput(): void {
    this.parentForm?.get(this.name)?.reset('');
  }
}
