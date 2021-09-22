import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-error',
  templateUrl: './error.component.html',
  styleUrls: [ './error.component.scss' ],
})
export class ErrorComponent {
  @Output() retryError = new EventEmitter<void>();

  @Input() message?: string;
  @Input() icon?: string;
  @Input() allowRetry?: boolean;

  onRetryError(): void {
    this.retryError.emit();
  }
}
