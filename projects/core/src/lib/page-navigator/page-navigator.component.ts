import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: ['./page-navigator.component.scss'],
})
export class PageNavigatorComponent implements OnInit {
  @Input() allowFullScreen = 'false';
  @Input() navigationMode = 'nextAndPrev';
  @Output() onEdit = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {
  }

  editPage(e) {
    this.onEdit.emit(e);
  }
}
