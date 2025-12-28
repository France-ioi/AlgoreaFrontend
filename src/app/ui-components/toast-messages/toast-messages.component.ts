import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageV2, MessageService } from 'src/app/services/message.service';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-toast-messages',
  templateUrl: './toast-messages.component.html',
  styleUrls: [ './toast-messages.component.scss' ],
  standalone: true,
  imports: [
    ButtonIconComponent,
  ]
})
export class ToastMessagesComponent implements OnInit, OnDestroy {
  private toastService = inject(MessageService);

  messages = toSignal(this.toastService.messages$);

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.toastService.messageCloseEvent$.subscribe(m => {
      this.toastService.dismiss(m);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(message: MessageV2): void {
    this.toastService.dismiss(message);
  }
}
