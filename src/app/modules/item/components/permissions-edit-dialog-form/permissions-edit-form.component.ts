import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { generateValues, getTargetTypeString, PermissionsDialogData } from '../../helpers/permissions-texts';
import { GroupComputedPermissions, GroupPermissions } from '../../../../shared/http-services/group-permissions.service';
import { ItemCorePerm } from '../../../../shared/models/domain/item-permissions';
import { TypeFilter } from '../../helpers/composition-filter';
import { ItemViewPerm } from '../../../../shared/models/domain/item-view-permission';
import {
  ItemGrantViewPerm,
} from '../../../../shared/models/domain/item-grant-view-permission';
import { ItemWatchPerm } from '../../../../shared/models/domain/item-watch-permission';
import { ItemEditPerm } from '../../../../shared/models/domain/item-edit-permission';
import { merge, Subject } from 'rxjs';
import { permissionsConstraintsValidator } from '../../helpers/permissions-constraints-validator';
import { withComputePermissions } from '../../helpers/computed-permissions';
import { ButtonModule } from 'primeng/button';
import { SwitchFieldComponent } from '../../../shared-components/components/collapsible-section/switch-field/switch-field.component';
import {
  ProgressSelectComponent
} from '../../../shared-components/components/collapsible-section/progress-select/progress-select.component';
import { CollapsibleSectionComponent } from '../../../shared-components/components/collapsible-section/collapsible-section.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-permissions-edit-form[giverPermissions]',
  templateUrl: 'permissions-edit-form.component.html',
  styleUrls: [ 'permissions-edit-form.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    CollapsibleSectionComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    ButtonModule,
  ],
})
export class PermissionsEditFormComponent implements OnDestroy, OnChanges {
  @Input() permissions?: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>;
  @Input() computedPermissions?: Omit<GroupComputedPermissions,'canEnterFrom'|'canEnterUntil'>;
  @Input() giverPermissions!: ItemCorePerm;
  @Input() targetType: TypeFilter = 'Users';
  @Input() acceptButtonDisabled = false;
  @Output() save = new EventEmitter<Partial<GroupPermissions>>();
  @Output() cancel = new EventEmitter<void>();

  targetTypeString = '';

  permissionsDialogData: PermissionsDialogData = {
    canViewValues: [],
    canGrantViewValues: [],
    canEditValues: [],
    canWatchValues: [],
  };

  form = this.fb.group({
    canView: [ ItemViewPerm.None ],
    canGrantView: [ ItemGrantViewPerm.None ],
    canWatch: [ ItemWatchPerm.None ],
    canEdit: [ ItemEditPerm.None ],
    canMakeSessionOfficial: [ false ],
    isOwner: [ true ],
  });

  private regenerateValues = new Subject<void>();
  private subscription = merge(
    this.form.valueChanges,
    this.regenerateValues.asObservable()
  ).subscribe(() => {
    if (this.permissions) {
      const receiverPermissions = this.form.value as GroupPermissions;
      this.permissionsDialogData = generateValues(this.targetType, receiverPermissions, this.giverPermissions);

      if (this.computedPermissions) {
        this.permissionsDialogData = withComputePermissions(
          this.permissionsDialogData,
          this.permissions,
          receiverPermissions,
          this.computedPermissions,
          this.targetType,
        );
      }
    }
  });

  constructor(private fb: UntypedFormBuilder) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.regenerateValues.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.targetTypeString = getTargetTypeString(this.targetType);
    if ((changes.permissions || changes.giverPermissions) && this.permissions) {
      this.form.setValidators(permissionsConstraintsValidator(this.giverPermissions, this.targetType));
      this.form.updateValueAndValidity();
      this.form.reset({ ...this.permissions }, { emitEvent: false });
    }
    if (changes.targetType) this.regenerateValues.next();
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
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
