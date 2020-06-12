import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: ['./code-token.component.scss'],
})
export class CodeTokenComponent implements OnInit {
  @Input() refreshed = true;

  @Output() refresh = new EventEmitter<any>();

  code = 'X78ghJiK';

  constructor() {}

  ngOnInit() {}

  refreshCode(e) {}
}
