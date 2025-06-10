import { inject, Injectable } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ConfirmationModalComponent } from 'src/app/ui-components/confirmation-modal/confirmation-modal.component';
import { Observable } from 'rxjs';

export interface ConfirmationModalData {
  message: string,
  messageIconStyleClass?: string,
  acceptButtonCaption?: string,
  acceptButtonStyleClass?: string,
  acceptButtonIcon?: string,
  rejectButtonCaption?: string,
  rejectButtonStyleClass?: string,
  rejectButtonIcon?: string,
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationModalService {
  private dialogService = inject(Dialog);

  open<D = ConfirmationModalData, R = boolean>(
    data: D,
    config?: Omit<DialogConfig<D, DialogRef<R>>, 'data'>,
  ): Observable<R | undefined> {
    return this.dialogService.open<R, D>(ConfirmationModalComponent, {
      data,
      ...config
    }).closed;
  }
}
