import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { NgClass, NgIf, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: [ './section-header.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgTemplateOutlet,
  ],
})
export class SectionHeaderComponent {

  @Input() caption = '';
  @Input() icon = '';
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';
  @Input() styleClass: string | string[] | Set<string> | { [klass: string]: boolean } = '';

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }
}
