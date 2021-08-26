import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { Manager } from '../../http-services/get-group-managers.service';
import { ProgressSectionValue } from '../../../shared-components/components/progress-section/progress-section.component';
import { UpdateGroupManagersService } from '../../http-services/update-group-managers.service';

@Component({
  selector: 'alg-manager-permission-dialog',
  templateUrl: './manager-permission-dialog.component.html',
  styleUrls: [ './manager-permission-dialog.component.scss' ],
})
export class ManagerPermissionDialogComponent implements OnChanges {
  @Input() visible?: boolean;
  @Input() group?: Group;
  @Input() manager?: Manager;

  managerValues = {
    canManage: 'none',
    canGrantGroupAccess: false,
    canWatchMembers: false,
  };

  @Output() close = new EventEmitter<void>();

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

  isUpdating = false;

  constructor(private updateGroupManagersService: UpdateGroupManagersService) {
  }

  ngOnChanges(): void {
    if (this.manager) {
      this.managerValues = {
        canManage: this.manager.canManage,
        canGrantGroupAccess: this.manager.canGrantGroupAccess,
        canWatchMembers: this.manager.canWatchMembers,
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onAccept(): void {
    if (!this.manager || !this.group) {
      return;
    }

    this.isUpdating = true;
    this.updateGroupManagersService.update(this.manager.id, this.group.id, this.managerValues).subscribe({
      next: () => {
        this.isUpdating = false;
        this.onClose();
      },
      error: () => this.isUpdating = false,
    });
  }
}
