import { Component, signal, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: [ './tooltip.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NgTemplateOutlet
  ]
})
export class TooltipComponent {
  text = signal<string>('');
  styleClass = signal('');
  contentTemplate = signal<TemplateRef<HTMLElement> | undefined>(undefined);
}
