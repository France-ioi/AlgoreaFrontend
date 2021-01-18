import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ProgressSectionValue } from 'src/app/modules/shared-components/components/progress-section/progress-section.component';
import { Permissions } from 'src/app/shared/http-services/group-permissions.service';
import { TypeFilter } from '../composition-filter/composition-filter.component';
import { generateCanEditValues, generateCanGrantViewValues,
  generateCanViewValues, generateCanWatchValues } from './permissions-edit-dialog-texts';

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnChanges {

  @Input() visible?: boolean;
  @Input() title?: string;
  @Input() initialPermissions?: Permissions;
  @Input() targetType: TypeFilter = 'Users';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Permissions>();

  targetTypeString = '';

  canViewValues: ProgressSectionValue<string>[] = []
  canGrantViewValues: ProgressSectionValue<string>[] = []
  canWatchValues: ProgressSectionValue<string>[] = []
  canEditValues: ProgressSectionValue<string>[] = []

  permissions: Permissions = {
    can_view: 'none',
    can_grant_view: 'none',
    can_watch: 'none',
    can_edit: 'none',
    can_make_session_official: false,
    is_owner: true,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if ('targetType' in changes) {
      this.canViewValues = generateCanViewValues(this.targetType);
      this.canGrantViewValues = generateCanGrantViewValues(this.targetType);
      this.canWatchValues = generateCanWatchValues(this.targetType);
      this.canEditValues = generateCanEditValues(this.targetType);
    }

    if (this.initialPermissions) {
      this.permissions = { ...this.initialPermissions };
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    this.save.emit(this.permissions);
    this.close.emit();
  }
}
