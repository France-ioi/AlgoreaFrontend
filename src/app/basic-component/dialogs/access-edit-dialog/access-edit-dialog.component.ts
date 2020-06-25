import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'alg-access-edit-dialog',
  templateUrl: './access-edit-dialog.component.html',
  styleUrls: ['./access-edit-dialog.component.scss'],
})
export class AccessEditDialogComponent implements OnInit {
  objectKeys = Object.keys;

  constructor(
    public dialogRef: MatDialogRef<AccessEditDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {}

  onClose(e) {
    this.dialogRef.close(e);
  }
}
