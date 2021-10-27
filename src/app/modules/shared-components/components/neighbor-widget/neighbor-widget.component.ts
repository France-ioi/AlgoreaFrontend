import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
})
export class NeighborWidgetComponent {
  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();
}
