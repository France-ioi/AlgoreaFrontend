import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProgressSectionValue } from 'src/app/modules/shared-components/components/progress-section/progress-section.component';
import { TypeFilter } from '../item-chapter-view/group-situation-chapter-view/composition-filter/composition-filter.component';
import { generateCanEditValues, generateCanGrantViewValues,
  generateCanViewValues, generateCanWatchValues } from './permissions-edit-dialog-texts';

export interface Permissions {
  can_view: 'none'|'info'|'content'|'content_with_descendants'|'solution'
  can_enter_from: boolean,
  can_grant_view: 'none'|'enter'|'content'|'content_with_descendants'|'solution'|'solution_with_grant',
  can_watch: 'none'|'result'|'answer'|'answer_with_grant',
  can_edit: 'none'|'children'|'all'|'all_with_grant',
  can_make_session_official: boolean,
  is_owner: boolean,
}

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnInit {

  @Input() visible?: boolean;
  @Input() title?: string;
  @Input() permissions?: Permissions;
  @Output() close = new EventEmitter<Permissions>();
  @Input() targetType: TypeFilter = 'Users';

  targetTypeString = '';

  canViewValues: ProgressSectionValue<string>[] = []
  canGrantViewValues: ProgressSectionValue<string>[] = []
  canWatchValues: ProgressSectionValue<string>[] = []
  canEditValues: ProgressSectionValue<string>[] = []

  ngOnInit(): void {
    switch (this.targetType) {
      case 'Users':
        this.targetTypeString = $localize`The user`;
        break;
      case 'Groups':
        this.targetTypeString = $localize`The group`;
        break;
      case 'Teams':
        this.targetTypeString = $localize`The team`;
        break;
    }

    this.canViewValues = generateCanViewValues(this.targetTypeString);
    this.canGrantViewValues = generateCanGrantViewValues(this.targetTypeString);
    this.canWatchValues = generateCanWatchValues(this.targetTypeString);
    this.canEditValues = generateCanEditValues(this.targetTypeString);
  }

  onClose(): void {
    if (this.permissions) this.close.emit(this.permissions);
  }
}
