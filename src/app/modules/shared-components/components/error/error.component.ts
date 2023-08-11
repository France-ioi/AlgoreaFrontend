import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-error',
  templateUrl: './error.component.html',
  styleUrls: [ './error.component.scss' ],
})
export class ErrorComponent {
  @Output() refresh = new EventEmitter<void>();

  @Input() message?: string;
  @Input() icon?: string;
  @Input() showRefreshButton = false;
  @Input() buttonCaption = 'Retry';
  @Input() buttonStyleClass?: string;
  @Input() link?: string;

  onRefresh(): void {
    this.refresh.emit();
  }
}
