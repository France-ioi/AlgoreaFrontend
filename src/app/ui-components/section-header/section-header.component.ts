import { Component, contentChild, input, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: [ './section-header.component.scss' ],
  imports: [
    NgTemplateOutlet,
  ]
})
export class SectionHeaderComponent {

  caption = input('');
  icon = input('');
  theme = input<'success' | 'warning' | 'danger'>('success');
  styleClass = input<string | string[] | Set<string> | { [klass: string]: boolean }>('');

  contentTemplate = contentChild<TemplateRef<unknown>>('content');
}
