import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrls: [ './sub-section.component.scss' ],
})
export class SubSectionComponent {
  @Input() icon?: string; // font awesome identifier
  @Input() label?: string;
  @Input() tooltip?: string;
  @Input() canClose = false;

  @Output() close = new EventEmitter<any>();

  onCloseEvent(e: MouseEvent): void {
    this.close.emit(e);
  }

}
