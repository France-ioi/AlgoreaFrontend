import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { AttachGroupDialogComponent } from '../attach-group-dialog/attach-group-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { ConfirmPasswordDialogComponent } from '../confirm-password-dialog/confirm-password-dialog.component';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  onClose(e) {
    this.dialogRef.close(e);
  }

  onAttachClicked(e) {
    const ref = this.dialog.open(AttachGroupDialogComponent, {
      maxHeight: '41rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        icon: 'fa fa-link',
        label: 'Attach to another group',
        comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.'
      }
    });

    ref.afterClosed().subscribe(result => {
      console.log(`Attach Group dialog result ${result}`);
    });
  }

  onResetPassword(e) {
    const ref = this.dialog.open(ResetPasswordDialogComponent, {
      maxHeight: '41rem',
      minWidth: '50rem',
      maxWidth: '50rem',
      minHeight: '17rem',
      data: {
        icon: 'fa fa-key',
        label: 'Reset password',
        user: 'Jeannomonetto'
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result == true) {
        const codeRef = this.dialog.open(ConfirmPasswordDialogComponent, {
          maxHeight: '41rem',
          minWidth: '50rem',
          maxWidth: '50rem',
          minHeight: '17rem',
          data: {
            icon: 'fa fa-key',
            label: 'Reset password',
            user: 'Jeannomonetto',
            code: 'HJGT7890'
          }
        });

        codeRef.afterClosed().subscribe(result => {
          console.log(`Confirm password dialog result ${result}`);
        });
      }
      console.log(`Reset password dialog result ${result}`);
    })
  }

}
