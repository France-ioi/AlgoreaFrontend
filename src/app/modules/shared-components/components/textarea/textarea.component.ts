import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
})
export class TextareaComponent implements OnInit, OnChanges {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: FormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
  @Input() disabled = false;

  @Output() textChange = new EventEmitter<string>();

  value = '';

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.disabled) this.parentForm?.disable();
    else this.parentForm?.enable();
  }

  onTextChange(): void {
    this.textChange.emit(this.parentForm?.get(this.inputName)?.value as string);
  }
}
