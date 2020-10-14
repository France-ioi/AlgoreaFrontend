import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'alg-state-widget',
  templateUrl: './state-widget.component.html',
  styleUrls: ['./state-widget.component.scss'],
})
export class StateWidgetComponent implements OnInit {

  @Input() type: 'Undefined'|'Discovery'|'Application'|'Validation'|'Challenge';
  @Input() disabled = false;

  icon = '';

  ngOnInit(): void {

    switch (this.type) {
      case 'Undefined':
        this.icon = 'fa fa-book-open';
        break;
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
    }
  }
}
