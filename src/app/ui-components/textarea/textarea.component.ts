import { Component, input } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
  ]
})
export class TextareaComponent {
  inputName = input(''); // name of the input in the parent form
  parentForm = input<UntypedFormGroup>();

  icon = input('');
  placeholder = input('');
  /** When true, the user can drag the bottom edge to enlarge the textarea vertically. */
  resizable = input(false);
}
