import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
// import * as randomString from 'random-string';

@Component({
  selector: 'app-code-token',
  templateUrl: './code-token.component.html',
  styleUrls: ['./code-token.component.scss']
})
export class CodeTokenComponent implements OnInit {
  
  @Output() onRefresh = new EventEmitter<any>();

  @Input() refresh = true;

  code = 'X78ghJiK';

  constructor() { }

  ngOnInit() {
  }

  refreshCode(e) {
    // this.code = randomString({
    //   length: 8,
    //   numeric: true,
    //   letters: true,
    //   special: false
    // });
  }

}
