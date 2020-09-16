import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
})
export class TextareaComponent implements OnInit {
  @Input() icon = '';
  @Input() placeholder = '';

  @Output() valueChange = new EventEmitter<string>();

  value:string;

  constructor() {}

  ngOnInit() {}

  onChange()
  {
    this.valueChange.emit(this.value);
  }
}
