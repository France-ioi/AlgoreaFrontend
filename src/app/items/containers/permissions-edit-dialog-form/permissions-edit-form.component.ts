import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { generateValues, getTargetTypeString, PermissionsDialogData } from '../../models/permissions-texts';
import { GroupComputedPermissions, GroupPermissions } from 'src/app/data-access/group-permissions.service';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { TypeFilter } from '../../models/composition-filter';
import { allowsViewingContent, ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { merge, Subject } from 'rxjs';
import { permissionsConstraintsValidator } from '../../models/permissions-constraints-validator';
import { withComputePermissions } from '../../models/computed-permissions';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { ProgressSelectComponent } from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { CollapsibleSectionComponent } from 'src/app/ui-components/collapsible-section/collapsible-section.component';
import { DatePipe } from '@angular/common';
import { backendInfiniteDateString, farFutureDateString, isInfinite } from 'src/app/utils/date';
import { CanEnterComponent, CanEnterValue } from 'src/app/ui-components/collapsible-section/can-enter/can-enter.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

// eslint-disable-next-line max-len
const canEnterWarningMessage = $localize`As the group or user has currently "can view >= content" permission, the configured entering times have no effect, the group or user will be able to enter the activity at any time the activity allows it.`;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'alg-permissions-edit-form[giverPermissions]',
  templateUrl: 'permissions-edit-form.component.html',
  styleUrls: [ 'permissions-edit-form.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CollapsibleSectionComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    DatePipe,
    CanEnterComponent,
    ButtonComponent,
  ]
})
export class PermissionsEditFormComponent implements OnDestroy, OnChanges {
  @Input() permissions?: GroupPermissions;
  @Input() computedPermissions?: GroupComputedPermissions;
  @Input() giverPermissions!: ItemCorePerm;
  @Input() targetType: TypeFilter = 'Users';
  @Input() acceptButtonDisabled = false;
  @Input() requiresExplicitEntry = false;
  @Output() save = new EventEmitter<Partial<GroupPermissions>>();
  @Output() cancel = new EventEmitter<void>();

  targetTypeString = '';
  canEnterWarningMessage?: string;

  permissionsDialogData: PermissionsDialogData = {
    canViewValues: [],
    canGrantViewValues: [],
    canEditValues: [],
    canWatchValues: [],
  };

  form = this.fb.group({
    canEnterEnabled: [ false ],
    canEnter: [ null ],
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
      const receiverPermissions = this.form.value as GroupPermissions & { canEnter: CanEnterValue | null };
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

      const { canEnter, canView } = receiverPermissions;
      this.canEnterWarningMessage = canEnter && this.computedPermissions
        && (allowsViewingContent(this.computedPermissions) || allowsViewingContent({ canView }))
        ? canEnterWarningMessage
        : undefined;
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
      this.form.reset({
        ...this.permissions,
        ...(this.requiresExplicitEntry ? {
          canEnterEnabled: !isInfinite(this.permissions.canEnterFrom),
          canEnter: {
            canEnterFrom: isInfinite(this.permissions.canEnterFrom) ? new Date() : this.permissions.canEnterFrom,
            canEnterUntil: isInfinite(this.permissions.canEnterUntil) ? new Date(farFutureDateString) : this.permissions.canEnterUntil,
          },
        } : {}),
      }, { emitEvent: false });
    }
    if (changes.targetType) this.regenerateValues.next();
  }

  onAccept(): void {
    if (!this.form.dirty || this.form.invalid) return;

    const canEnterEnabled = this.form.get('canEnterEnabled')?.value as boolean;
    const canEnter = this.form.get('canEnter')?.value as CanEnterValue | null;
    const groupPermissions: Partial<GroupPermissions> = {
      canView: this.form.get('canView')?.value as GroupPermissions['canView'],
      canGrantView: this.form.get('canGrantView')?.value as GroupPermissions['canGrantView'],
      canWatch: this.form.get('canWatch')?.value as GroupPermissions['canWatch'],
      canEdit: this.form.get('canEdit')?.value as GroupPermissions['canEdit'],
      canMakeSessionOfficial: this.form.get('canMakeSessionOfficial')?.value as GroupPermissions['canMakeSessionOfficial'],
      isOwner: this.form.get('isOwner')?.value as GroupPermissions['isOwner'],
      ...(this.requiresExplicitEntry ? canEnterEnabled && canEnter ? {
        canEnterFrom: canEnter.canEnterFrom,
        canEnterUntil: canEnter.canEnterUntil,
      } : {
        canEnterFrom: new Date(backendInfiniteDateString),
        canEnterUntil: new Date(backendInfiniteDateString),
      } : {}),
    };

    this.save.emit(groupPermissions);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
