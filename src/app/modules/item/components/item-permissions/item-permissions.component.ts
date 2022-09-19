import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { WatchedGroup } from 'src/app/core/services/group-watching.service';
import {
  ProgressSelectValue
} from '../../../shared-components/components/collapsible-section/progress-select/progress-select.component';
import { generateCanViewValues } from '../../helpers/permissions-texts';
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

  constructor() {
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

  closePermissionsDialog(changed: boolean): void {
    this.isPermissionsDialogOpened = false;
    if (changed) {
      this.changed.emit();
    }
  }
}
