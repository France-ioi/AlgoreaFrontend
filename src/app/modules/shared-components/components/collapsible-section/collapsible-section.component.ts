import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-collapsible-section',
  templateUrl: './collapsible-section.component.html',
  styleUrls: [ './collapsible-section.component.scss' ]
})
export class CollapsibleSectionComponent {

  @Input() header = '';
  @Input() errorMessage?: string;
  @Input() icon = '';

  @Input() disabled = false;
  @Input() collapsed = true;
  @Input() collapsible = true;
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }

  onCollapse(): void {
    if (this.collapsible) {
      this.collapsed = !this.collapsed;
    }
  }
}
