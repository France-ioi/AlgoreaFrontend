import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
})
export class TextareaComponent implements OnInit {
  @Input() icon;
  @Input() placeholder;
  @Input() value;

  constructor() {}

  ngOnInit() {}
}
