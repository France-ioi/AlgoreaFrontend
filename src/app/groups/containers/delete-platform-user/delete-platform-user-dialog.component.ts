import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';

export interface DeletePlatformUserDialogData {
  login: string,
}

@Component({
  selector: 'alg-delete-platform-user-dialog',
  templateUrl: './delete-platform-user-dialog.component.html',
  styleUrl: './delete-platform-user-dialog.component.scss',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
  ],
})
export class DeletePlatformUserDialogComponent {
  private dialogRef = inject(DialogRef<boolean>);
  private data = inject<DeletePlatformUserDialogData>(DIALOG_DATA);

  readonly login = this.data.login;
  readonly title = $localize`Delete the user and its data on this platform`;
  readonly loginLabel = $localize`Login`;

  private readonly loginControl = new FormControl('', { nonNullable: true });
  readonly form = new UntypedFormGroup({
    login: this.loginControl,
  });

  private readonly typedLogin = toSignal(this.loginControl.valueChanges, { initialValue: '' });
  readonly canConfirm = computed(() => this.typedLogin().trim() === this.login);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.dialogRef.close(true);
  }
}
