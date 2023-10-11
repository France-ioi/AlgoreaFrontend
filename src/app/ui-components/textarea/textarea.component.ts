import { Component, Input } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    InputTextareaModule,
    NgClass,
    FormErrorComponent,
  ],
})
export class TextareaComponent {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: UntypedFormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
}
