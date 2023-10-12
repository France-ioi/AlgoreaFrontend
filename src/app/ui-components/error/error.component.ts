import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'alg-error',
  templateUrl: './error.component.html',
  styleUrls: [ './error.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    ButtonModule,
    RouterLink,
  ],
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
