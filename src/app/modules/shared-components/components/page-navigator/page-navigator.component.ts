import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
})
export class PageNavigatorComponent {
  @Input() allowEditing = false;
  @Input() allowFullScreen = false;
  @Input() navigationMode = 'nextAndPrev';
  @Output() edit = new EventEmitter<void>();

  editPage(): void {
    this.edit.emit();
  }
}
