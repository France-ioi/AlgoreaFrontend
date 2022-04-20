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

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }
}
