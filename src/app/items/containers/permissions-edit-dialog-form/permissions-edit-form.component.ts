import {
  Component, computed, DestroyRef, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
const canEnterWarningText = $localize`As the group or user has currently "can view >= content" permission, the configured entering times have no effect, the group or user will be able to enter the activity at any time the activity allows it.`;

const emptyPermissionsDialogData: PermissionsDialogData = {
  canViewValues: [],
  canGrantViewValues: [],
  canEditValues: [],
  canWatchValues: [],
};

@Component({
  selector: 'alg-permissions-edit-form',
  templateUrl: 'permissions-edit-form.component.html',
  styleUrl: 'permissions-edit-form.component.scss',
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
export class PermissionsEditFormComponent {
  private fb = inject(UntypedFormBuilder);
  private destroyRef = inject(DestroyRef);

  permissions = input<GroupPermissions>();
  computedPermissions = input<GroupComputedPermissions>();
  giverPermissions = input.required<ItemCorePerm>();
  targetType = input<TypeFilter>('Users');
  acceptButtonDisabled = input(false);
  requiresExplicitEntry = input(false);
  save = output<Partial<GroupPermissions>>();
  cancel = output<void>();

  protected readonly targetTypeString = computed(() => getTargetTypeString(this.targetType()));
  protected readonly canEnterWarningMessage = signal<string | undefined>(undefined);
  protected readonly permissionsDialogData = signal<PermissionsDialogData>(emptyPermissionsDialogData);

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

  constructor() {
    toObservable(computed(() => ({
      permissions: this.permissions(),
      giver: this.giverPermissions(),
    }))).pipe(takeUntilDestroyed()).subscribe(() => this.resetForm());

    toObservable(this.targetType).pipe(takeUntilDestroyed()).subscribe(() => this.regenerateValues.next());

    merge(
      this.form.valueChanges,
      this.regenerateValues.asObservable(),
    ).pipe(takeUntilDestroyed()).subscribe(() => {
      const permissions = this.permissions();
      if (permissions) {
        const receiverPermissions = this.form.value as GroupPermissions & { canEnter: CanEnterValue | null };
        let dialogData = generateValues(this.targetType(), receiverPermissions, this.giverPermissions());

        const computedPermissions = this.computedPermissions();
        if (computedPermissions) {
          dialogData = withComputePermissions(
            dialogData,
            permissions,
            receiverPermissions,
            computedPermissions,
            this.targetType(),
          );
        }

        this.permissionsDialogData.set(dialogData);

        const { canEnter, canView } = receiverPermissions;
        this.canEnterWarningMessage.set(
          canEnter && computedPermissions
          && (allowsViewingContent(computedPermissions) || allowsViewingContent({ canView }))
            ? canEnterWarningText
            : undefined,
        );
      }
    });

    this.destroyRef.onDestroy(() => {
      this.regenerateValues.complete();
    });
  }

  private resetForm(): void {
    const permissions = this.permissions();
    if (!permissions) return;

    this.form.reset({
      ...permissions,
      ...(this.requiresExplicitEntry() ? {
        canEnterEnabled: !isInfinite(permissions.canEnterFrom),
        canEnter: {
          canEnterFrom: isInfinite(permissions.canEnterFrom) ? new Date() : permissions.canEnterFrom,
          canEnterUntil: isInfinite(permissions.canEnterUntil) ? new Date(farFutureDateString) : permissions.canEnterUntil,
        },
      } : {}),
    }, { emitEvent: false });
    this.form.setValidators(permissionsConstraintsValidator(this.giverPermissions(), this.targetType()));
    this.form.updateValueAndValidity({ emitEvent: false });
    this.regenerateValues.next();
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
      ...(this.requiresExplicitEntry() ? canEnterEnabled && canEnter ? {
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
