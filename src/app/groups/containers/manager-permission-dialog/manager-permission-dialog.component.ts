import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Group } from '../../data-access/get-group-by-id.service';
import { Manager } from '../../data-access/get-group-managers.service';
import { ProgressSelectValue, ProgressSelectComponent } from
  'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { GroupManagerPermissionChanges, UpdateGroupManagersService } from '../../data-access/update-group-managers.service';
import { formatUser } from 'src/app/groups/models/user';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { UserSessionService } from 'src/app/services/user-session.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { CollapsibleSectionComponent } from 'src/app/ui-components/collapsible-section/collapsible-section.component';
import { DialogModule } from 'primeng/dialog';
import { NgIf } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'alg-manager-permission-dialog',
  templateUrl: './manager-permission-dialog.component.html',
  styleUrls: [ './manager-permission-dialog.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    DialogModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    CollapsibleSectionComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    LoadingComponent,
    ButtonIconComponent,
    ButtonComponent,
  ],
})
export class ManagerPermissionDialogComponent implements OnChanges {
  @Input() visible?: boolean;
  @Input() group?: Group;
  @Input() manager?: Manager;

  @Output() close = new EventEmitter<{ updated: boolean }>();

  managementLevelValues: ProgressSelectValue<GroupManagerPermissionChanges['canManage']>[] = [
    {
      value: 'none',
      label: $localize`Read-only`,
      comment: $localize`Can list the members`
    },
    {
      value: 'memberships',
      label: $localize`Membership`,
      comment: $localize`Can manage (add, remove, invite, ...) members`
    },
    {
      value: 'memberships_and_group',
      label: $localize`Memberships and group`,
      comment: $localize`Can manage members, managers, and change group settings`
    },
  ];

  userCaption?: string;
  isUpdating = false;

  form = this.fb.group({
    canManage: [ 'none' ],
    canGrantGroupAccess: [ false ],
    canWatchMembers: [ false ],
  });

  constructor(
    private sessionService: UserSessionService,
    private updateGroupManagersService: UpdateGroupManagersService,
    private actionFeedbackService: ActionFeedbackService,
    private fb: UntypedFormBuilder,
    private confirmationModalService: ConfirmationModalService,
  ) {}

  ngOnChanges(): void {
    if (this.manager) {
      this.form.reset({
        canManage: this.manager.canManage,
        canGrantGroupAccess: this.manager.canGrantGroupAccess,
        canWatchMembers: this.manager.canWatchMembers,
      }, { emitEvent: false });

      this.userCaption = this.manager.login ? formatUser({
        login: this.manager.login,
        firstName: this.manager.firstName,
        lastName: this.manager.lastName,
      }) : this.manager.name;
    }
  }

  onClose(): void {
    this.close.emit({ updated: false });
  }

  onAccept(): void {
    const manager = this.manager;
    const group = this.group;
    if (!manager || !group) throw new Error('Unexpected: Missed input component params');

    const currentUserId = this.sessionService.session$.value?.groupId;
    if (!currentUserId) throw new Error('Unexpected: Missed current used ID');

    const canManageValue = this.form.get('canManage')?.value as GroupManagerPermissionChanges['canManage'];

    const canManage = manager.id !== currentUserId || manager.id === currentUserId &&
      (manager.canManage !== 'memberships_and_group') || canManageValue === 'memberships_and_group';

    const proceedSaving$: Observable<undefined | true> = canManage ? of(undefined) : this.confirmationModalService.open({
      message: $localize`Are you sure to remove from yourself the permission to edit group settings and edit managers?
        You may lose manager access and not be able to restore it.`,
      messageIconStyleClass: 'ph ph-warning-circle alg-validation-error',
      acceptButtonCaption: 'Yes, save these changes.',
      acceptButtonIcon: 'ph-bold ph-check',
      acceptButtonStyleClass: 'danger',
      rejectButtonIcon: 'ph-bold ph-x',
    }, { width: '30rem', panelClass: 'alg-z-index-1002' }).pipe(filter(accepted => !!accepted));

    const managerPermissions: GroupManagerPermissionChanges = {
      canManage: this.form.get('canManage')?.value as GroupManagerPermissionChanges['canManage'],
      canGrantGroupAccess: this.form.get('canGrantGroupAccess')?.value as GroupManagerPermissionChanges['canGrantGroupAccess'],
      canWatchMembers: this.form.get('canWatchMembers')?.value as GroupManagerPermissionChanges['canWatchMembers'],
    };

    this.isUpdating = true;
    proceedSaving$.pipe(
      switchMap(() => this.updateGroupManagersService.update(group.id, manager.id, managerPermissions)),
    ).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`New permissions successfully saved.`);
        this.close.emit({ updated: true });
      },
      error: () => {
        this.actionFeedbackService.error($localize`Failed to save permissions.`);
      },
      complete: () => this.isUpdating = false,
    });
  }
}
