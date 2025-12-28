import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { NgClass, NgIf } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

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
          opacity: 0,
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
  ],
  imports: [ NgIf, ButtonIconComponent, ButtonComponent, NgClass ]
})
export class NeighborWidgetComponent {
  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();
}
