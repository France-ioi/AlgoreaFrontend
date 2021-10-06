import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { Manager } from '../../http-services/get-group-managers.service';
import { ProgressSelectValue } from
  '../../../shared-components/components/collapsible-section/progress-select/progress-select.component';
import { GroupManagerPermissionChanges, UpdateGroupManagersService } from '../../http-services/update-group-managers.service';
import { formatUser } from '../../../../shared/helpers/user';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'alg-manager-permission-dialog',
  templateUrl: './manager-permission-dialog.component.html',
  styleUrls: [ './manager-permission-dialog.component.scss' ],
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
      label: $localize`Full`,
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
    private updateGroupManagersService: UpdateGroupManagersService,
    private actionFeedbackService: ActionFeedbackService,
    private fb: FormBuilder,
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
    if (!this.manager || !this.group) {
      throw new Error('Unexpected: Missed input component params');
    }

    const managerPermissions: GroupManagerPermissionChanges = {
      canManage: this.form.get('canManage')?.value as GroupManagerPermissionChanges['canManage'],
      canGrantGroupAccess: this.form.get('canGrantGroupAccess')?.value as GroupManagerPermissionChanges['canGrantGroupAccess'],
      canWatchMembers: this.form.get('canWatchMembers')?.value as GroupManagerPermissionChanges['canWatchMembers'],
    };

    this.isUpdating = true;
    this.updateGroupManagersService.update(this.group.id, this.manager.id, managerPermissions).subscribe({
      next: () => {
        this.isUpdating = false;
        this.actionFeedbackService.success($localize`New permissions successfully saved.`);
        this.close.emit({ updated: true });
      },
      error: () => {
        this.isUpdating = false;
        this.actionFeedbackService.error($localize`Failed to save permissions.`);
      }
    });
  }
}
