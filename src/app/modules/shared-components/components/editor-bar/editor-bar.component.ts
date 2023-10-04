import { Component, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'alg-editor-bar',
  templateUrl: './editor-bar.component.html',
  styleUrls: [ './editor-bar.component.scss' ],
  standalone: true,
  imports: [ ButtonModule ],
})
export class EditorBarComponent {
  @Output() cancel = new EventEmitter<void>();

  onCancelClick(): void {
    this.cancel.emit();
  }

}
