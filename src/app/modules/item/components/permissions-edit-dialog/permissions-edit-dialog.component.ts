import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ProgressSelectValue } from
  'src/app/modules/shared-components/components/collapsible-section/progress-select/progress-select.component';
import { Permissions } from 'src/app/shared/helpers/group-permissions';
import { TypeFilter } from '../composition-filter/composition-filter.component';
import { generateCanEditValues, generateCanGrantViewValues,
  generateCanViewValues, generateCanWatchValues } from '../../helpers/permissions-texts';

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
        canView: this.permissions.canView,
        canGrantView: this.permissions.canGrantView,
        canWatch: this.permissions.canWatch,
        canEdit: this.permissions.canEdit,
        canMakeSessionOfficial: this.permissions.canMakeSessionOfficial,
        isOwner: this.permissions.isOwner,
      }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    const permissions: Permissions = {
      canView: this.form.get('canView')?.value as Permissions['canView'],
      canGrantView: this.form.get('canGrantView')?.value as Permissions['canGrantView'],
      canWatch: this.form.get('canWatch')?.value as Permissions['canWatch'],
      canEdit: this.form.get('canEdit')?.value as Permissions['canEdit'],
      canMakeSessionOfficial: this.form.get('canMakeSessionOfficial')?.value as Permissions['canMakeSessionOfficial'],
      isOwner: this.form.get('isOwner')?.value as Permissions['isOwner'],
    };

    this.save.emit(permissions);
    this.close.emit();
  }
}
