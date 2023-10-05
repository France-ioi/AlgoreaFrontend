import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NeighborWidgetComponent } from '../neighbor-widget/neighbor-widget.component';
import { WatchButtonComponent } from '../watch-button/watch-button.component';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    WatchButtonComponent,
    NgClass,
    NeighborWidgetComponent,
  ],
})
export class PageNavigatorComponent {
  @Input() allowWatching = false;
  @Input() isWatched = false;
  @Input() allowFullScreen = false;
  @Input() showNewStartWatchButton = false;

  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() watch = new EventEmitter<Event>();
  @Output() stopWatch = new EventEmitter<void>();

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();

  constructor() {
  }
}
