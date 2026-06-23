import { Component, input, output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-left-menu-back-button',
  templateUrl: './left-menu-back-button.component.html',
  styleUrl: './left-menu-back-button.component.scss',
  imports: [ ButtonIconComponent ]
})
export class LeftMenuBackButtonComponent {
  close = output<void>();
  icon = input('ph ph-arrow-left');
  contentIcon = input<string>();
  title = input.required<string>();
}
