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
    'can_view': [ 'none' ],
    'can_grant_view': [ 'none' ],
    'can_watch': [ 'none' ],
    'can_edit': [ 'none' ],
    'can_make_session_official': [ false ],
    'is_owner': [ true ],
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
      this.form.reset({ ...this.permissions }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    const formControls = {
      can_view: this.form.get('can_view'),
      can_grant_view: this.form.get('can_grant_view'),
      can_watch: this.form.get('can_watch'),
      can_edit: this.form.get('can_edit'),
      can_make_session_official: this.form.get('can_make_session_official'),
      is_owner: this.form.get('is_owner'),
    };

    const permissions: Permissions = {
      can_view: formControls.can_view?.value as Permissions['can_view'],
      can_grant_view: formControls.can_grant_view?.value as Permissions['can_grant_view'],
      can_watch: formControls.can_watch?.value as Permissions['can_watch'],
      can_edit: formControls.can_edit?.value as Permissions['can_edit'],
      can_make_session_official: formControls.can_make_session_official?.value as Permissions['can_make_session_official'],
      is_owner: formControls.is_owner?.value as Permissions['is_owner'],
    };

    this.save.emit(permissions);
    this.close.emit();
  }
}
