import { Component, contentChild, input, signal, TemplateRef } from '@angular/core';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'alg-collapsible-section',
  templateUrl: './collapsible-section.component.html',
  styleUrls: [ './collapsible-section.component.scss' ],
  imports: [ SectionHeaderComponent, NgTemplateOutlet ]
})
export class CollapsibleSectionComponent {

  header = input.required<string>();
  errorMessage = input<string>();
  icon = input.required<string>();
  disabled = input(false);
  protected readonly collapsed = signal(true);
  collapsible = input(true);
  theme = input<'success' | 'warning' | 'danger'>('success');
  messageStyleClass = input('danger');

  contentTemplate = contentChild<TemplateRef<unknown>>('content');

  onCollapse(): void {
    if (this.collapsible()) {
      this.collapsed.update(c => !c);
    }
  }
}
