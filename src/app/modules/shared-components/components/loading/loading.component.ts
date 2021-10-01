import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-loading',
  templateUrl: './loading.component.html',
  styleUrls: [ './loading.component.scss' ],
})
export class LoadingComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'large';

  styles = {
    'small': {
      width: '2.4rem',
      height: '2.4rem',
    },
    'medium': {
      width: '3.3333rem',
      height: '3.3333rem',
    },
    'large': {
      width: '6rem',
      height: '6rem',
    }
  };
}
