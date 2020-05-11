import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "app-confirm-password-dialog",
  templateUrl: "./confirm-password-dialog.component.html",
  styleUrls: ["./confirm-password-dialog.component.scss"],
})
export class ConfirmPasswordDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ConfirmPasswordDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {}

  onClose(e) {
    this.dialogRef.close(e);
  }
}
