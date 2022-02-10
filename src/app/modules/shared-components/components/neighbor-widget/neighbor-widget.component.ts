import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
  animations: [
    trigger('buttonAnimation', [
      transition(':leave', [
        style({
          marginRight: 0,
          opacity: 1,
        }),
        animate('.2s .2s ease-in-out', style({
          marginRight: '-.5rem',
          opacity: 0,
        })),
      ]),
      transition(':enter', [
        style({
          marginRight: '-.5rem',
          opacity: 0,
        }),
        animate('.2s .2s ease-in-out', style({
          marginRight: 0,
          opacity: 1,
        })),
      ]),
    ]),
    trigger('borderAnimation', [
      state('roundOn', style({
        borderRadius: '50% 0 0 50%',
      })),
      state('roundOff', style({
        borderRadius: '0',
      })),
      transition('roundOn => roundOff', [
        animate('.2s .3s ease-in-out'),
      ]),
      transition('roundOff => roundOn', [
        animate('.2s .1s ease-in-out'),
      ]),
    ])
  ]
})
export class NeighborWidgetComponent {
  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();
}
