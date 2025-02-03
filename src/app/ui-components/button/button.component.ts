import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'button[alg-button], a[alg-button]',
  templateUrl: './button.component.html',
  styleUrls: [ './button.component.scss' ],
  standalone: true,
  imports: [
    NgClass
  ]
})
export class ButtonComponent {
  @Input() icon?: string;
}
