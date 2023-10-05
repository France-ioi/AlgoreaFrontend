import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-state-widget',
  templateUrl: './state-widget.component.html',
  styleUrls: [ './state-widget.component.scss' ],
  standalone: true,
  imports: [ NgIf, NgClass ],
})
export class StateWidgetComponent implements OnChanges {

  @Input() type: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge' = 'Undefined';
  @Input() disabled = false;

  icon = '';
  class = '';

  ngOnChanges(_changes: SimpleChanges): void {
    switch (this.type) {
      case 'Discovery':
        this.icon = 'fa fa-book-open';
        break;
      case 'Application':
        this.icon = 'fa fa-code';
        break;
      case 'Validation':
        this.icon = 'fa fa-video';
        break;
      case 'Challenge':
        this.icon = 'fa fa-laptop-code';
        break;
      case 'Undefined':
      default:
        this.type = 'Undefined';
        this.icon = 'fa fa-book-open';
        break;
    }

    this.class = this.type.toLowerCase();
  }
}
