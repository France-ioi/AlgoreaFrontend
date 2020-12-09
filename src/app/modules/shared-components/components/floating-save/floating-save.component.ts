import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'alg-floating-save',
  templateUrl: './floating-save.component.html',
  styleUrls: [ './floating-save.component.scss' ]
})
export class FloatingSaveComponent {

  @Input() saving = false;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor() {}

  onSave(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
