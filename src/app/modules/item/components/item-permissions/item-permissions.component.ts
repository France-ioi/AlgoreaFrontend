import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { WatchedGroup } from 'src/app/core/services/group-watching.service';
import {
  ProgressSelectValue
} from '../../../shared-components/components/collapsible-section/progress-select/progress-select.component';
import { generateCanViewValues } from '../../helpers/permissions-texts';
import { GroupPermissionsService } from '../../../../shared/http-services/group-permissions.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { allowsGivingPermToItem, ItemCorePerm, ItemOwnerPerm, ItemSessionPerm } from 'src/app/shared/models/domain/item-permissions';

@Component({
  selector: 'alg-item-permissions',
  templateUrl: './item-permissions.component.html',
  styleUrls: [ './item-permissions.component.scss' ],
})
export class ItemPermissionsComponent implements OnChanges {
  @Output() changed = new EventEmitter<void>();

  @Input() itemData?: ItemData;
  @Input() watchedGroup?: WatchedGroup;

  canViewValues: ProgressSelectValue<string>[] = generateCanViewValues('Groups');
  isPermissionsDialogOpened = false;
  watchedGroupPermissions?: ItemCorePerm & ItemOwnerPerm & ItemSessionPerm;
  lockEdit?: 'content' | 'group' | 'contentGroup';

  constructor(private groupPermissionsService: GroupPermissionsService, private actionFeedbackService: ActionFeedbackService) {
  }

  ngOnChanges(): void {
    this.watchedGroupPermissions = this.itemData?.item?.watchedGroup?.permissions ? {
      ...this.itemData.item.watchedGroup.permissions,
      canMakeSessionOfficial: false,
    } : undefined;

    const currentUserCanGrantAccess = this.watchedGroup?.currentUserCanGrantAccess;
    const currentUserCanGivePermissions = this.itemData && allowsGivingPermToItem(this.itemData.item.permissions);

    this.lockEdit = currentUserCanGrantAccess && !currentUserCanGivePermissions ? 'content' :
      !currentUserCanGrantAccess && currentUserCanGivePermissions ? 'group' :
        !currentUserCanGrantAccess && !currentUserCanGivePermissions ? 'contentGroup' : undefined;
  }

  openPermissionsDialog(): void {
    this.isPermissionsDialogOpened = true;
  }

  closePermissionsDialog(): void {
    this.isPermissionsDialogOpened = false;
  }

  onPermissionsDialogSave(permissions: Partial<ItemCorePerm & ItemOwnerPerm & ItemSessionPerm>): void {
    if (!this.itemData || !this.watchedGroup) {
      throw new Error('Unexpected: Missed input data');
    }

    this.groupPermissionsService.updatePermissions(this.watchedGroup.route.id, this.watchedGroup.route.id,
      this.itemData.item.id, permissions)
      .subscribe({
        next: _res => {
          this.changed.next();
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
        },
        error: err => {
          this.actionFeedbackService.unexpectedError();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }

}
