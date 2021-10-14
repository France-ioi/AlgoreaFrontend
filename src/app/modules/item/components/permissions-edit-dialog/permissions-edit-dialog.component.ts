import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ProgressSelectValue } from
  'src/app/modules/shared-components/components/collapsible-section/progress-select/progress-select.component';
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
  @Input() permissions?: Permissions;
  @Input() targetType: TypeFilter = 'Users';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Permissions>();

  targetTypeString = '';

  canViewValues: ProgressSelectValue<string>[] = [];
  canGrantViewValues: ProgressSelectValue<string>[] = [];
  canWatchValues: ProgressSelectValue<string>[] = [];
  canEditValues: ProgressSelectValue<string>[] = [];

  form = this.fb.group({
    canView: [ 'none' ],
    canGrantView: [ 'none' ],
    canWatch: [ 'none' ],
    canEdit: [ 'none' ],
    canMakeSessionOfficial: [ false ],
    isOwner: [ true ],
  });

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('targetType' in changes) {
      this.canViewValues = generateCanViewValues(this.targetType);
      this.canGrantViewValues = generateCanGrantViewValues(this.targetType);
      this.canWatchValues = generateCanWatchValues(this.targetType);
      this.canEditValues = generateCanEditValues(this.targetType);
    }

    if (this.permissions) {
      this.form.reset({
        canView: this.permissions.can_view,
        canGrantView: this.permissions.can_grant_view,
        canWatch: this.permissions.can_watch,
        canEdit: this.permissions.can_edit,
        canMakeSessionOfficial: this.permissions.can_make_session_official,
        isOwner: this.permissions.is_owner,
      }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    const permissions: Permissions = {
      can_view: this.form.get('canView')?.value as Permissions['can_view'],
      can_grant_view: this.form.get('canGrantView')?.value as Permissions['can_grant_view'],
      can_watch: this.form.get('canWatch')?.value as Permissions['can_watch'],
      can_edit: this.form.get('canEdit')?.value as Permissions['can_edit'],
      can_make_session_official: this.form.get('canMakeSessionOfficial')?.value as Permissions['can_make_session_official'],
      is_owner: this.form.get('isOwner')?.value as Permissions['is_owner'],
    };

    this.save.emit(permissions);
    this.close.emit();
  }
}
