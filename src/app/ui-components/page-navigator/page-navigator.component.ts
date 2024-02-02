import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NeighborWidgetComponent } from '../neighbor-widget/neighbor-widget.component';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    NeighborWidgetComponent,
  ],
})
export class PageNavigatorComponent {
  @Input() allowFullScreen = false;

  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();

  constructor() {
  }
}
