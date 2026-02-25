import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RelativeTimePipe } from '../../pipes/relativeTime';
import { TooltipDirective, TooltipPosition } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-relative-time',
  templateUrl: './relative-time.component.html',
  styleUrls: [ './relative-time.component.scss' ],
  imports: [
    DatePipe,
    RelativeTimePipe,
    TooltipDirective,
  ]
})
export class RelativeTimeComponent {
  @Input() value?: string | Date;
  @Input() tooltipPosition: TooltipPosition = 'bottom';
}
