import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: [ './section-header.component.scss' ],
})
export class SectionHeaderComponent {

  @Input() title = '';
  @Input() icon = '';
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';
  @Input() styleClass: string | string[] | Set<string> | { [klass: string]: boolean } = '';

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }
}
