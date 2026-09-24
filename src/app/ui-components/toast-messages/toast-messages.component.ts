import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MessageV2, MessageService } from 'src/app/services/message.service';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { deviceSupportsHover } from 'src/app/utils/device-supports-hover';

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
  private hovered = new WeakSet<MessageV2>();
  private focused = new WeakSet<MessageV2>();

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

  onMouseEnter(message: MessageV2): void {
    if (!deviceSupportsHover()) return;
    this.hovered.add(message);
    this.syncHeld(message);
  }

  onMouseLeave(message: MessageV2): void {
    if (!deviceSupportsHover()) return;
    this.hovered.delete(message);
    this.syncHeld(message);
  }

  onFocusIn(message: MessageV2): void {
    this.focused.add(message);
    this.syncHeld(message);
  }

  onFocusOut(message: MessageV2, event: FocusEvent): void {
    const related = event.relatedTarget;
    if (related instanceof Node && (event.currentTarget as Node).contains(related)) {
      return;
    }
    this.focused.delete(message);
    this.syncHeld(message);
  }

  private syncHeld(message: MessageV2): void {
    this.toastService.setAutoDismissHeld(
      message,
      this.hovered.has(message) || this.focused.has(message),
    );
  }
}
