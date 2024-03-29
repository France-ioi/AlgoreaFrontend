import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-input',
  templateUrl: './input.component.html',
  styleUrls: [ './input.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    TooltipModule,
    FormErrorComponent,
  ],
})
export class InputComponent {
  @Input() name = ''; // name of the input in the parent form
  @Input() parentForm?: UntypedFormGroup;

  @Input() placeholder = ''; // avoid 'undefined' if no placeholder specified
  @Input() inputType = 'text';
  @Input() inputIcon = '';
  @Input() buttonIcon?: string; // a phosphor-icon identifier for the input button
  @Input() hasClearButton = false;

  @Input() pTooltip = '';
  @Input() tooltipEvent = 'hover';
  @Input() tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'right';
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
