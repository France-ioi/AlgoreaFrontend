import { Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';

@Component({
  selector: 'alg-boolean-section',
  templateUrl: './boolean-section.component.html',
  styleUrls: [ './boolean-section.component.scss' ]
})
export class BooleanSectionComponent implements OnInit {

  @Input() title = '';
  @Input() icon = '';

  @Input() defaultValue?: boolean;

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;
  @ContentChild('label') labelTemplate?: TemplateRef<any>;

  @Output() change = new EventEmitter<boolean>();

  value = false;

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) this.value = this.defaultValue;
  }

  onSet(val: boolean): void {
    this.value = val;
    this.change.emit(this.value);
  }
}
