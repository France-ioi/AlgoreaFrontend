import { Component, input, output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-modal',
  templateUrl: './modal.component.html',
  styleUrls: [ './modal.component.scss' ],
  standalone: true,
  imports: [
    ButtonIconComponent,
  ]
})
export class ModalComponent {
  closeEvent = output<void>();

  title = input<string | undefined>(undefined);
  allowToClose = input(true);
  showFooter = input(true);
}
