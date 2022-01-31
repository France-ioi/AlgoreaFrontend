import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { ProgressSelectValue } from
  'src/app/modules/shared-components/components/collapsible-section/progress-select/progress-select.component';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { PermissionsInfo } from '../../helpers/item-permissions';
import { generateValues, permissionsConstraintsValidator } from '../../helpers/item-permissions-constraints';
import { TypeFilter } from '../composition-filter/composition-filter.component';

export interface PermissionsDialogData {
  canViewValues: ProgressSelectValue<string>[],
  canGrantViewValues: ProgressSelectValue<string>[],
  canWatchValues: ProgressSelectValue<string>[],
  canEditValues: ProgressSelectValue<string>[],
  isOwnerDisabledTooltip?: string[],
  canMakeSessionOfficialDisabledTooltip?: string[],
}

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

  permissionsDialogData: PermissionsDialogData = {
    canViewValues: [],
    canGrantViewValues: [],
    canEditValues: [],
    canWatchValues: [],
  };

  form = this.fb.group({
    canView: [ 'none' ],
    canGrantView: [ 'none' ],
    canWatch: [ 'none' ],
    canEdit: [ 'none' ],
    canMakeSessionOfficial: [ false ],
    isOwner: [ true ],
  });

  private regenerateValues = new BehaviorSubject(undefined);

  constructor(private fb: FormBuilder) {
    combineLatest([ this.form.valueChanges, this.regenerateValues.asObservable() ])
      .subscribe(() => {
        if (this.permissions && this.giverPermissions) {
          const receiverPermissions = this.form.value as GroupPermissions;
          this.permissionsDialogData = generateValues(this.targetType, receiverPermissions, this.giverPermissions);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.permissions || changes.giverPermissions) {
      if (this.permissions && this.giverPermissions) {
        this.form.setValidators(permissionsConstraintsValidator(this.permissions, this.giverPermissions));
        this.form.updateValueAndValidity();
        this.form.reset({ ...this.permissions }, { emitEvent: false });
      }
    }
    if (changes.targetType) this.regenerateValues.next(undefined);
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
