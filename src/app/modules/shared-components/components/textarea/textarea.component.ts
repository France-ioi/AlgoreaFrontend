import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [ './textarea.component.scss' ],
})
export class TextareaComponent implements OnInit {
  @Input() icon = '';
  @Input() placeholder = '';
  @Input() disabled = false;

  @Output() textChange = new EventEmitter<string>();

  value = '';

  constructor() {}

  ngOnInit() {}

  setValue(text: string) {
    this.value = text;
    this.onChange();
  }

  onChange() {
    this.textChange.emit(this.value);
  }
}
