import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
  animations: [
    trigger('buttonAnimation', [
      transition(':leave', [
        style({
          marginRight: 0,
        }),
        animate('.2s .2s ease-in-out', style({
          marginRight: '-2.6rem',
        })),
      ]),
      transition(':enter', [
        style({
          marginRight: '-2.6rem',
          opacity: 0,
        }),
        animate('.2s .2s ease-in-out', style({
          marginRight: 0,
          opacity: 1,
        })),
      ]),
    ]),
  ]
})
export class NeighborWidgetComponent {
  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();
}
