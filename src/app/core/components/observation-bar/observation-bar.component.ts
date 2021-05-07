import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ]
})
export class ObservationBarComponent {
  @Input() groupName = '';
  @Output() cancel = new EventEmitter<void>();

  onCancelClick(): void {
    this.cancel.emit();
  }

}
