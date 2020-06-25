import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrls: ['./sub-section.component.scss'],
})
export class SubSectionComponent implements OnInit {
  @Input() icon;
  @Input() label;
  @Input() tooltip;
  @Input() closed = false;

  @Output() close = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onCloseEvent(e) {
    this.close.emit(e);
  }
}
