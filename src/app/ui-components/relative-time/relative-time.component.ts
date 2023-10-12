import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, DatePipe } from '@angular/common';
import { RelativeTimePipe } from '../../pipes/relativeTime';

@Component({
  selector: 'alg-relative-time',
  templateUrl: './relative-time.component.html',
  styleUrls: [ './relative-time.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    TooltipModule,
    RelativeTimePipe,
  ]
})
export class RelativeTimeComponent {
  @Input() value?: string;
  @Input() tooltipPosition = 'bottom';
}
