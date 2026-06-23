import { Component, input } from '@angular/core';

@Component({
  selector: 'button[alg-button-icon], a[alg-button-icon]',
  templateUrl: './button-icon.component.html',
  styleUrl: './button-icon.component.scss',
})
export class ButtonIconComponent {
  icon = input.required<string>();
}
