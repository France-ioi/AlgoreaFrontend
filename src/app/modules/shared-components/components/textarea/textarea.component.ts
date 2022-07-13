import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
})
export class TextareaComponent {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: UntypedFormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
}
