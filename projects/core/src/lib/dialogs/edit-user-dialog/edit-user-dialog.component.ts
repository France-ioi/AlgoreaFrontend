import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { AttachGroupDialogComponent } from '../attach-group-dialog/attach-group-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { ConfirmPasswordDialogComponent } from '../confirm-password-dialog/confirm-password-dialog.component';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss'],
})
export class EditUserDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {}

  onClose(e) {
    this.dialogRef.close(e);
  }

  onAttachClicked(_e) {
    const ref = this.dialog.open(AttachGroupDialogComponent, {
      maxHeight: '41rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        icon: 'fa fa-link',
        label: 'Attach to another group',
        comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s '
               + 'standard dummy text ever since the 1500s',
      },
    });

    ref.afterClosed().subscribe((_result) => {});
  }

  onResetPassword(_e) {
    const ref = this.dialog.open(ResetPasswordDialogComponent, {
      maxHeight: '41rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        icon: 'fa fa-key',
        label: 'Reset password',
        user: 'Jeannomonetto',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result === true) {
        const codeRef = this.dialog.open(ConfirmPasswordDialogComponent, {
          maxHeight: '41rem',
          minWidth: '50rem',
          maxWidth: '50rem',
          minHeight: '17rem',
          data: {
            icon: 'fa fa-key',
            label: 'Reset password',
            user: 'Jeannomonetto',
            code: 'HJGT7890',
          },
        });

        codeRef.afterClosed().subscribe((_code) => {});
      }
    });
  }
}
