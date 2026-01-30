import { Component, inject, OnInit, signal } from '@angular/core';
import { Group } from '../../models/group';
import { Manager } from '../../data-access/get-group-managers.service';
import { ProgressSelectValue, ProgressSelectComponent } from
  'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { GroupManagerPermissionChanges, UpdateGroupManagersService } from '../../data-access/update-group-managers.service';
import { formatUser } from 'src/app/groups/models/user';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserSessionService } from 'src/app/services/user-session.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { CollapsibleSectionComponent } from 'src/app/ui-components/collapsible-section/collapsible-section.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { groupManagershipLevelEnum as l } from '../../models/group-management';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ManagerPermissionDialogParams {
  group: Group,
  manager: Manager,
}

export interface ManagerPermissionDialogResult {
  updated: boolean,
}

@Component({
  selector: 'alg-manager-permission-dialog',
  templateUrl: './manager-permission-dialog.component.html',
  styleUrls: [ './manager-permission-dialog.component.scss' ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CollapsibleSectionComponent,
    ProgressSelectComponent,
    SwitchFieldComponent,
    LoadingComponent,
    ButtonComponent,
    ModalComponent,
  ]
})
export class ManagerPermissionDialogComponent implements OnInit {
  private sessionService = inject(UserSessionService);
  private updateGroupManagersService = inject(UpdateGroupManagersService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private fb = inject(UntypedFormBuilder);
  private confirmationModalService = inject(ConfirmationModalService);

  params = signal(inject<ManagerPermissionDialogParams>(DIALOG_DATA));
  dialogRef = inject(DialogRef<ManagerPermissionDialogResult>);

  managementLevelValues: ProgressSelectValue<GroupManagerPermissionChanges['canManage']>[] = [
    {
      value: l.none,
      label: $localize`Read-only`,
      comment: $localize`Can list the members`
    },
    {
      value: l.memberships,
      label: $localize`Membership`,
      comment: $localize`Can manage (add, remove, invite, ...) members`
    },
    {
      value: l.memberships_and_group,
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

  ngOnInit(): void {
    const manager = this.params().manager;

    this.form.reset({
      canManage: manager.canManage,
      canGrantGroupAccess: manager.canGrantGroupAccess,
      canWatchMembers: manager.canWatchMembers,
    }, { emitEvent: false });

    this.userCaption = manager.login ? formatUser({
      login: manager.login,
      firstName: manager.firstName,
      lastName: manager.lastName,
    }) : manager.name;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onAccept(): void {
    const manager = this.params().manager;
    const group = this.params().group;

    const currentUserId = this.sessionService.session$.value?.groupId;
    if (!currentUserId) throw new Error('Unexpected: Missed current used ID');

    const canManageValue = this.form.get('canManage')?.value as GroupManagerPermissionChanges['canManage'];

    const canManage = manager.id !== currentUserId || manager.id === currentUserId &&
      (manager.canManage !== l.memberships_and_group || canManageValue === l.memberships_and_group);

    const proceedSaving$: Observable<undefined | true> = canManage ? of(undefined) : this.confirmationModalService.open({
      title: $localize`Confirm Action`,
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
        this.dialogRef.close({ updated: true });
      },
      error: () => {
        this.actionFeedbackService.error($localize`Failed to save permissions.`);
      },
      complete: () => this.isUpdating = false,
    });
  }
}
