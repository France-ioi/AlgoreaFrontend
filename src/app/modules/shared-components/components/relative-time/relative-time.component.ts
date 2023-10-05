import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-relative-time',
  templateUrl: './relative-time.component.html',
  styleUrls: [ './relative-time.component.scss' ],
})
export class RelativeTimeComponent {
  @Input() value?: string;
  @Input() tooltipPosition = 'bottom';
}
