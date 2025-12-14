import { inject, Injectable, signal } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ConfirmationModalComponent } from 'src/app/ui-components/confirmation-modal/confirmation-modal.component';
import { Observable } from 'rxjs';

export interface ConfirmationModalData {
  title?: string,
  message: string,
  messageIconStyleClass?: string,
  acceptButtonCaption?: string,
  acceptButtonStyleClass?: string,
  acceptButtonIcon?: string,
  rejectButtonCaption?: string,
  rejectButtonStyleClass?: string,
  rejectButtonIcon?: string,
  allowToClose?: boolean,
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationModalService {
  private dialogService = inject(Dialog);
  opened = signal(false);

  open<D = ConfirmationModalData, R = boolean>(
    data: D,
    config?: Omit<DialogConfig<D, DialogRef<R>>, 'data'>,
  ): Observable<R | undefined> {
    this.opened.set(true);
    const closedResult$ = this.dialogService.open<R, D>(ConfirmationModalComponent, {
      data,
      ...config
    }).closed;

    closedResult$.subscribe({
      complete: () => this.opened.set(false),
    });

    return closedResult$;
  }
}
