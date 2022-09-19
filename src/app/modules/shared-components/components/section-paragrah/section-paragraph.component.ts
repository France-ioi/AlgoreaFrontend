import { Component, Input, ContentChild, Output, EventEmitter, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-section-paragraph',
  templateUrl: './section-paragraph.component.html',
  styleUrls: [ './section-paragraph.component.scss' ],
})
export class SectionParagraphComponent {
  @Input() icon?: string;
  @Input() label = '';
  @Input() collapsible = false;
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';
  @Input() hasBorder = false;
  @Input() data: any;
  @Input() remainOrigin = true;
  @Input() collapsed = false;

  @Output() collapse = new EventEmitter<boolean>();

  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;

  toggleContent(): void {
    if (!this.collapsible) {
      return;
    }
    this.collapsed = !this.collapsed;
    this.collapse.emit(this.collapsed);
  }
}
