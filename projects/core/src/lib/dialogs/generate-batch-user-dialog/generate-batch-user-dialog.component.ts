import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'lib-generate-batch-user-dialog',
  templateUrl: './generate-batch-user-dialog.component.html',
  styleUrls: ['./generate-batch-user-dialog.component.scss'],
})
export class GenerateBatchUserDialogComponent implements OnInit {
  prefix1 = 'mat';
  isPassword = true;
  randomString = '';
  prefix = '';

  constructor(
    public dialogRef: MatDialogRef<GenerateBatchUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {}

  onTypeChange(idx) {
    this.isPassword = idx === 0;
  }

  onPrefixChange(e) {
    this.prefix = e;
  }

  onSuffixChange(e) {}

  onClose(e) {
    this.dialogRef.close(e);
  }
}
