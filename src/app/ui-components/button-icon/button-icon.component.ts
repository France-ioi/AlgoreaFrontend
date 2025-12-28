import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'button[alg-button-icon], a[alg-button-icon]',
  templateUrl: './button-icon.component.html',
  styleUrls: [ './button-icon.component.scss' ],
  imports: [
    NgClass,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonIconComponent {
  icon = input.required<string>();
}
