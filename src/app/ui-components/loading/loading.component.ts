import { Component, input } from '@angular/core';

@Component({
  selector: 'alg-loading',
  templateUrl: './loading.component.html',
  styleUrls: [ './loading.component.scss' ],
})
export class LoadingComponent {
  /**@deprecated**/
  size = input<'small' | 'medium' | 'large'>('large');
}
