import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, ContentChild, TemplateRef, OnInit } from '@angular/core';

export interface ProgressSectionValue<T> {
  label: string,
  comment: string,
  value: T,
  disabled?: boolean,
}

@Component({
  selector: 'alg-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: [ './progress-section.component.scss' ]
})
export class ProgressSectionComponent<T> implements OnChanges, OnInit {

  @Input() title = '';
  @Input() icon = '';

  @Input() defaultValue?: T;
  @Input() value?: T;

  @Input() values: ProgressSectionValue<T>[] = [];

  @ContentChild('collapsedHeader') collapsedHeaderTemplate?: TemplateRef<any>;
  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;
  @ContentChild('body') bodyTemplate?: TemplateRef<any>;

  @Input() collapsed = true;
  @Input() disabled = false;

  @Output() change = new EventEmitter<T>();

  selected = 0;

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) this.value = this.defaultValue;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
  }

  onCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  onSet(val: T): void {
    this.value = val;
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
    this.change.emit(this.value);
  }
}
