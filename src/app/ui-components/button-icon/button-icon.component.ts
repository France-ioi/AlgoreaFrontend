import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'button[alg-button-icon], a[alg-button-icon]',
  templateUrl: './button-icon.component.html',
  styleUrls: [ './button-icon.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
  ]
})
export class ButtonIconComponent {
  @Input({ required: true }) icon!: string;
}
