import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
})
export class TextareaComponent {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: FormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
}
