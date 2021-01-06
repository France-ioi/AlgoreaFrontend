import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Permissions {
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

  @Input() data?: PermissionsEditData;
  @Output() close = new EventEmitter<Permissions>();

  public visible = false;

  onClose(): void {
    if (this.data) this.close.emit(this.data.permissions);
  }
}
