import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-loading',
  templateUrl: './loading.component.html',
  styleUrls: [ './loading.component.scss' ],
})
export class LoadingComponent {
  /**@deprecated**/
  @Input() size: 'small' | 'medium' | 'large' = 'large';
}
