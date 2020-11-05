import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
})
export class TextareaComponent implements OnInit {
  @Input() inputName = ''; // name of the input in the parent form
  @Input() parentForm?: FormGroup;

  @Input() icon = '';
  @Input() placeholder = '';
  @Input() disabled = false;

  @Output() textChange = new EventEmitter<string>();

  value = '';

  constructor() {}

  ngOnInit(): void {}

  onChange(): void {
    this.textChange.emit(this.parentForm?.get(this.inputName)?.value as string);
  }
}
