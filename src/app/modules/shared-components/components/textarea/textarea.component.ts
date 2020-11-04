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


  constructor() {}

  ngOnInit(): void {}

  getValue(): string {
    return this.parentForm?.get(this.inputName)?.value as string;
  }

  setValue(text: string): void {
    this.parentForm?.get(this.inputName)?.patchValue(text);
    this.onChange();
  }

  onChange(): void {
    this.textChange.emit(this.getValue());
  }
}
