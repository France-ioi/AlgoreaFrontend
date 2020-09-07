import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
})
export class TextareaComponent implements OnInit {
  @Input() icon: string;
  @Input() placeholder: string;
  @Input() value: string;

  constructor() {}

  ngOnInit() {}
}
