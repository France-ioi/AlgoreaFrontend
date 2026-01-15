import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-error',
  templateUrl: './error.component.html',
  styleUrls: [ './error.component.scss' ],
  imports: [
    NgClass,
    RouterLink,
    ButtonComponent,
  ]
})
export class ErrorComponent {
  @Output() refresh = new EventEmitter<MouseEvent>();

  @Input() message?: string;
  @Input() icon?: string;
  @Input() showRefreshButton = false;
  @Input() buttonCaption = 'Retry';
  @Input() buttonStyleClass?: string;
  @Input() link?: string;

  onRefresh(event: MouseEvent): void {
    this.refresh.emit(event);
  }
}
