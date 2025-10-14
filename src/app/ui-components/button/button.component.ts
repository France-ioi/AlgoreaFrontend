import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { style, trigger, transition, animate } from '@angular/animations';

@Component({
  selector: 'button[alg-button], a[alg-button]',
  templateUrl: './button.component.html',
  styleUrls: [ './button.component.scss' ],
  standalone: true,
  imports: [
    NgClass
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('captionAnimation', [
      transition(':enter', [
        style({
          width: 0,
          opacity: 0,
        }),
        animate('200ms', style({ width: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('100ms', style({ width: 0, opacity: 1 })),
      ]),
    ]),
  ],
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.no-caption]': '!showCaption()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.no-caption-animatable]': 'withAnimation()',
  },
})
export class ButtonComponent {
  icon = input<string>();
  showCaption = input(true);
  withAnimation = input(false);
}
