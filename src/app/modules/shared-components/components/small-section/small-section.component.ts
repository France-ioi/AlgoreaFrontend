import { Component, Input } from '@angular/core';

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

  constructor() { }

  onCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
