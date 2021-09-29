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
      width: '24px',
      height: '24px',
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
