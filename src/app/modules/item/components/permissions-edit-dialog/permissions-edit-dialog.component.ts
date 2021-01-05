import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface Permissions {
  can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  can_enter_from: boolean,
  can_grant_view: 'none'|'enter'|'content'|'content_with_descendants'|'solution'|'solution_with_grant',
  can_watch: 'none'|'result'|'answer'|'answer_with_grant',
  can_edit: 'none'|'children'|'all'|'all_with_grant',
  can_make_session_official: boolean,
  is_owner: boolean,
}

export interface PermissionsEditData {
  title: string,
  permissions: Permissions
}

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent {

  readonly canViewValues = [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'Item is invisible to the user'
    },
    {
      value: 'info',
      label: 'Info',
      comment: 'User(s) can see the item title and description, but not its content'
    },
    {
      value: 'content',
      label: 'Content',
      comment: 'User(s) can see the content of this item'
    },
    {
      value: 'content_with_descendants',
      label: 'Content and descendants',
      comment: 'User(s) can also see the content of this items descendants (when possible for this group)'
    },
    {
      value: 'solution',
      label: 'Solution',
      comment: 'User(s) can also see the solution of this items and its descendants (when possible for this group)'
    }
  ];

  readonly canGrantViewValues = [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'User(s) can\'t grant any access to this item'
    },
    {
      value: 'enter',
      label: 'Info & enter',
      comment: 'User(s) can grant "Can view: info" and  "Can enter" access'
    },
    {
      value: 'content',
      label: 'Content',
      comment: 'User(s) can also grant "Can view: content" access'
    },
    {
      value: 'content_with_descendants',
      label: 'Content and descendants',
      comment: 'User(s) can also grant "Can view: content and descendants" access'
    },
    {
      value: 'solution',
      label: 'Solution',
      comment: 'User(s) can also grant "Can view: solution" access',
      disabled: true
    },
    {
      value: 'solution_with_grant',
      label: 'Solution and grant',
      comment: 'User(s) can also grant "Can grant view" access',
      disabled: true
    }
  ];

  readonly canWatchValues = [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'User(s) can\'t watch the activity of others on this item'
    },
    {
      value: 'result',
      label: 'Result',
      comment: 'User(s) can view information about submissions and scores of others on this item, but not their answers'
    },
    {
      value: 'answer',
      label: 'Answer',
      comment: 'User(s) can also look at other people\'s answers on this item'
    },
    {
      value: 'answer_with_grant',
      label: 'Answer and grant',
      comment: 'User(s) can also grant "Can watch" access to others'
    }
  ];

  readonly canEditValues = [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'User(s) can\'t make any changes to this item'
    },
    {
      value: 'children',
      label: 'Children',
      comment: 'User(s) can add children to this item and edit how permissions propagate to them'
    },
    {
      value: 'all',
      label: 'All',
      comment: 'User(s) can also edit the content of the item itself, but may not delete it'
    },
    {
      value: 'all_with_grant',
      label: 'All and grant',
      comment: 'User(s) can also give "Can edit" access to others'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<PermissionsEditDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PermissionsEditData,
  ) {

  }

  onClose(): void {
    this.dialogRef.close(this.data.permissions);
  }
}
