import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'alg-loading',
  templateUrl: './loading.component.html',
  styleUrls: [ './loading.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class LoadingComponent {
  /**@deprecated**/
  @Input() size: 'small' | 'medium' | 'large' = 'large';
}
