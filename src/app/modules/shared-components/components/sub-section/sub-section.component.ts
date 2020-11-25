import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrls: [ './sub-section.component.scss' ],
})
export class SubSectionComponent implements OnInit {
  @Input() icon?: string; // font awesome identifier
  @Input() label?: string;
  @Input() tooltip?: string;
  @Input() isClosed = false;

  @Output() close = new EventEmitter<any>();

  constructor() {
  }

  ngOnInit(): void {
  }

  onCloseEvent(e: MouseEvent): void {
    this.close.emit(e);
  }

}
