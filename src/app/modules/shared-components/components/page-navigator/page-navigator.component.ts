import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
})
export class PageNavigatorComponent implements OnInit {
  @Input() allowFullScreen = false;
  @Input() navigationMode = 'nextAndPrev';
  @Output() edit = new EventEmitter();

  constructor() {}

  ngOnInit(): void {
  }

  editPage(): void {
    this.edit.emit();
  }
}
