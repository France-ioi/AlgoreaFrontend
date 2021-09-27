import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-boolean-section',
  templateUrl: './boolean-section.component.html',
  styleUrls: [ './boolean-section.component.scss' ]
})
export class BooleanSectionComponent {

  @Input() title = '';
  @Input() icon = '';

  @Input() value = false;
  @Input() collapsible = true;
  @Input() collapsed = true;

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;
  @ContentChild('label') labelTemplate?: TemplateRef<any>;

  @Output() valueChange = new EventEmitter<boolean>();

  constructor() { }

  onSet(val: boolean): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
