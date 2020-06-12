import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrls: ['./sub-section.component.scss'],
})
export class SubSectionComponent implements OnInit {
  @Input() icon;
  @Input() label;
  @Input() tooltip;
  @Input() close = false;

  @Output() onClose = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onCloseEvent(e) {
    this.onClose.emit(e);
  }
}
