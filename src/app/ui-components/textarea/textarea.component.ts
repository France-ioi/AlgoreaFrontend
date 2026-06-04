import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    FormErrorComponent,
  ]
})
export class TextareaComponent {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: UntypedFormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
  /** When true, the user can drag the bottom edge to enlarge the textarea vertically. */
  @Input() resizable = false;
}
