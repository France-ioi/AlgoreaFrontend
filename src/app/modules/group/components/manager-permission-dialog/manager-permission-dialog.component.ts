import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { Manager } from '../../http-services/get-group-managers.service';
import { ProgressSectionValue } from '../../../shared-components/components/progress-section/progress-section.component';
import { UpdateGroupManagersService } from '../../http-services/update-group-managers.service';
import { formatUser } from '../../../../shared/helpers/user';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';

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

  managementLevelValues: ProgressSectionValue<string>[] = [
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

  managerValues = {
    canManage: 'none',
    canGrantGroupAccess: false,
    canWatchMembers: false,
  };

  userCaption?: string;
  isUpdating = false;
  valuesChanged = false;

  constructor(
    private updateGroupManagersService: UpdateGroupManagersService,
    private actionFeedbackService: ActionFeedbackService
  ) {}

  ngOnChanges(): void {
    if (this.manager) {
      this.managerValues = {
        canManage: this.manager.canManage,
        canGrantGroupAccess: this.manager.canGrantGroupAccess,
        canWatchMembers: this.manager.canWatchMembers,
      };

      this.userCaption = this.manager.login ? formatUser({
        login: this.manager.login,
        firstName: this.manager.firstName,
        lastName: this.manager.lastName,
      }) : this.manager.name;
    }
  }

  onClose(): void {
    this.close.emit({ updated: false });
    this.valuesChanged = false;
  }

  onAccept(): void {
    if (!this.manager || !this.group) {
      throw new Error('Unexpected: Missed input component params');
    }

    this.isUpdating = true;
    this.updateGroupManagersService.update(this.group.id, this.manager.id, this.managerValues).subscribe({
      next: () => {
        this.isUpdating = false;
        this.actionFeedbackService.success($localize`New permissions successfully saved.`);
        this.close.emit({ updated: true });
        this.valuesChanged = false;
      },
      error: () => {
        this.isUpdating = false;
        this.actionFeedbackService.error($localize`Failed to save permissions.`);
      }
    });
  }

  onValueChange(): void {
    this.valuesChanged = true;
  }
}
