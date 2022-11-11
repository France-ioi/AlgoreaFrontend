import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
})
export class PageNavigatorComponent {
  @Input() allowWatching = false;
  @Input() isWatched = false;
  @Input() allowFullScreen = false;

  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() watch = new EventEmitter<Event>();
  @Output() stopWatch = new EventEmitter<void>();

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();

  constructor() {
  }
}
