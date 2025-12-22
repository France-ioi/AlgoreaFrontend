import { Component, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: [ './tooltip.component.scss' ],
  standalone: true,
  imports: [
    NgTemplateOutlet
  ]
})
export class TooltipComponent {
  text = signal<string>('');
  styleClass = signal('');
  contentTemplate = signal<TemplateRef<HTMLElement> | undefined>(undefined);
}
