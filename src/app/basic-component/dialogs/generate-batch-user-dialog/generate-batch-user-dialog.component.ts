import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as randomString from 'random-string';

@Component({
  selector: 'app-generate-batch-user-dialog',
  templateUrl: './generate-batch-user-dialog.component.html',
  styleUrls: ['./generate-batch-user-dialog.component.scss']
})
export class GenerateBatchUserDialogComponent implements OnInit {

  prefix1 = 'mat';
  isPassword = true;
  random_string = '';
  prefix = '';

  constructor(
    public dialogRef: MatDialogRef<GenerateBatchUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.random_string = randomString({
      length: 0,
      numeric: true,
      letters: true,
      special: false
    });
  }

  onTypeChange(idx) {
    this.isPassword = idx === 0;
  }

  onPrefixChange(e) {
    this.prefix = e;
  }

  onSuffixChange(e) {
    this.random_string = randomString({
      length: parseInt(e, 10),
      numeric: true,
      letters: true,
      special: false
    });
  }

  onClose(e) {
    this.dialogRef.close(e);
  }

}
