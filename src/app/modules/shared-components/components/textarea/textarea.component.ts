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

  ngOnInit(): void {}

  setValue(text: string): void {
    this.value = text;
    this.onChange();
  }

  onChange(): void {
    this.textChange.emit(this.value);
  }
}
