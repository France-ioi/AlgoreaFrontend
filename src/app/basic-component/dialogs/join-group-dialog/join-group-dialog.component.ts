import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-join-group-dialog',
  templateUrl: './join-group-dialog.component.html',
  styleUrls: ['./join-group-dialog.component.scss'],
})
export class JoinGroupDialogComponent implements OnInit {
  seeActivity = false;
  viewPersonalInfo = false;
  modifyPersonalInfo = false;
  keepLocked = false;

  error = false;

  constructor(
    public dialogRef: MatDialogRef<JoinGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {}

  onClose(e) {
    this.dialogRef.close(e);
  }

  onJoin(e) {
    if (this.data.require_watch_approval && !this.seeActivity) {
      this.error = true;
      return;
    }

    if (
      (this.data.require_personal_info_access_approval === 'view' ||
        this.data.require_personal_info_access_approval === 'edit') &&
      !this.viewPersonalInfo
    ) {
      this.error = true;
      return;
    }

    if (
      this.data.require_personal_info_access_approval === 'edit' &&
      !this.modifyPersonalInfo
    ) {
      this.error = true;
      return;
    }

    if (this.data.require_lock_membership_approval_until && !this.keepLocked) {
      this.error = true;
      return;
    }

    this.error = false;
    this.dialogRef.close(e);
  }
}
