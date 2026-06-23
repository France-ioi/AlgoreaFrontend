import { Component, input } from '@angular/core';

@Component({
  selector: 'alg-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {
  /**@deprecated**/
  size = input<'small' | 'medium' | 'large'>('large');
}
