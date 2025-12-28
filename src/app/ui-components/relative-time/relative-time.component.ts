import { Component, Input } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { RelativeTimePipe } from '../../pipes/relativeTime';
import { TooltipDirective, TooltipPosition } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-relative-time',
  templateUrl: './relative-time.component.html',
  styleUrls: [ './relative-time.component.scss' ],
  imports: [
    NgIf,
    DatePipe,
    RelativeTimePipe,
    TooltipDirective,
  ]
})
export class RelativeTimeComponent {
  @Input() value?: string;
  @Input() tooltipPosition: TooltipPosition = 'bottom';
}
