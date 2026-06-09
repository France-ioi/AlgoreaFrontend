import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-error',
  templateUrl: './error.component.html',
  styleUrls: [ './error.component.scss' ],
  imports: [
    RouterLink,
    ButtonComponent,
  ]
})
export class ErrorComponent {
  refresh = output<MouseEvent>();

  message = input<string>();
  icon = input<string>();
  showRefreshButton = input(false);
  buttonCaption = input('Retry');
  buttonStyleClass = input<string>();
  link = input<string>();

  onRefresh(event: MouseEvent): void {
    this.refresh.emit(event);
  }
}
