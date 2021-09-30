import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-small-section',
  templateUrl: './small-section.component.html',
  styleUrls: [ './small-section.component.scss' ]
})
export class SmallSectionComponent {

  @Input() title = '';
  @Input() icon = '';

  @Input() disabled = false;
  @Input() collapsed = true;
  @Input() collapsible = true;

  @ContentChild('content') contentTemplate?: TemplateRef<any>;

  constructor() { }

  onCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
