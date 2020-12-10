import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-editor-bar',
  templateUrl: './editor-bar.component.html',
  styleUrls: [ './editor-bar.component.scss' ],
})
export class EditorBarComponent {
  @Output() cancel = new EventEmitter<void>();

  onCancelClick(): void {
    this.cancel.emit();
  }

}
