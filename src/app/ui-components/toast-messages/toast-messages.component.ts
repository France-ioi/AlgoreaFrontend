import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MessageV2, MessageService } from 'src/app/services/message.service';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-toast-messages',
  templateUrl: './toast-messages.component.html',
  styleUrl: './toast-messages.component.scss',
  imports: [
    ButtonIconComponent,
  ]
})
export class ToastMessagesComponent {
  private toastService = inject(MessageService);

  messages = toSignal(this.toastService.messages$);

  constructor() {
    this.toastService.messageCloseEvent$.pipe(
      takeUntilDestroyed(),
    ).subscribe(m => this.toastService.dismiss(m));
  }

  onClose(message: MessageV2): void {
    this.toastService.dismiss(message);
  }

  onMessageClick(message: MessageV2): void {
    if (message.onClick) {
      message.onClick();
      this.toastService.dismiss(message);
    }
  }
}
