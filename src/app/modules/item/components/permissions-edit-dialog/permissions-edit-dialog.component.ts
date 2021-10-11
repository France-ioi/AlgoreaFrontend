import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ProgressSelectValue } from
  'src/app/modules/shared-components/components/collapsible-section/progress-select/progress-select.component';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { PermissionsInfo } from '../../helpers/item-permissions';
import { permissionsConstraintsValidator } from '../../helpers/item-permissions-constraints';
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
  @Input() permissions?: GroupPermissions;
  @Input() giverPermissions?: PermissionsInfo;
  @Input() targetType: TypeFilter = 'Users';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<GroupPermissions>>();

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

    if (this.permissions && this.giverPermissions) {
      this.form.setValidators(permissionsConstraintsValidator(this.permissions, this.giverPermissions));
      this.form.updateValueAndValidity();
      this.form.reset({ ...this.permissions }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    if (!this.form.dirty || this.form.invalid) return;

    const groupPermissions: Partial<GroupPermissions> = {
      canView: this.form.get('canView')?.value as GroupPermissions['canView'],
      canGrantView: this.form.get('canGrantView')?.value as GroupPermissions['canGrantView'],
      canWatch: this.form.get('canWatch')?.value as GroupPermissions['canWatch'],
      canEdit: this.form.get('canEdit')?.value as GroupPermissions['canEdit'],
      canMakeSessionOfficial: this.form.get('canMakeSessionOfficial')?.value as GroupPermissions['canMakeSessionOfficial'],
      isOwner: this.form.get('isOwner')?.value as GroupPermissions['isOwner'],
    };

    this.save.emit(groupPermissions);
    this.close.emit();
  }
}
