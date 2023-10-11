import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { NgClass, NgIf, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-collapsible-section',
  templateUrl: './collapsible-section.component.html',
  styleUrls: [ './collapsible-section.component.scss' ],
  standalone: true,
  imports: [ NgClass, SectionHeaderComponent, NgIf, TagModule, NgTemplateOutlet ]
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
