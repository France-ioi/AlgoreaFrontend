import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: [ './section-header.component.scss' ],
  imports: [
    NgClass,
    NgTemplateOutlet,
  ]
})
export class SectionHeaderComponent {

  @Input() caption = '';
  @Input() icon = '';
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';
  @Input() styleClass: string | string[] | Set<string> | { [klass: string]: boolean } = '';

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }
}
