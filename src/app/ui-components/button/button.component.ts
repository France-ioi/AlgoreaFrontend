import { Component, input } from '@angular/core';

@Component({
  selector: 'button[alg-button], a[alg-button]',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.no-caption]': '!showCaption()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.no-caption-animatable]': 'withAnimation()',
  }
})
export class ButtonComponent {
  icon = input<string>();
  showCaption = input(true);
  withAnimation = input(false);
}
