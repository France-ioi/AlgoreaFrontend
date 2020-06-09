import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'lib-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: ['./code-token.component.scss'],
})
export class CodeTokenComponent implements OnInit {
  @Output() onRefresh = new EventEmitter<any>();

  @Input() refresh = true;

  code = 'X78ghJiK';

  constructor() {}

  ngOnInit() {}

  refreshCode(_e) {}
}
