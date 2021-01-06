import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypeFilter } from '../item-chapter-view/group-situation-chapter-view/composition-filter/composition-filter.component';

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
export class PermissionsEditDialogComponent implements OnInit {

  @Input() data?: PermissionsEditData;
  @Output() close = new EventEmitter<Permissions>();
  @Input() targetType: TypeFilter = 'Users';

  public visible = false;

  targetTypeString = '';

  ngOnInit(): void {
    this.targetTypeString = this.targetType.slice(0, -1).toLowerCase();
  }

  onClose(): void {
    if (this.data) this.close.emit(this.data.permissions);
  }
}
