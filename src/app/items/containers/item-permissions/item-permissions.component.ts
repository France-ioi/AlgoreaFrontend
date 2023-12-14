import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { WatchedGroup } from 'src/app/services/group-watching.service';
import {
  ProgressSelectValue,
  ProgressSelectComponent,
} from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import { generateCanViewValues } from '../../models/permissions-texts';
import { allowsGivingPermToItem, ItemCorePerm, ItemOwnerPerm, ItemSessionPerm } from 'src/app/models/item-permissions';
import { AllowsViewingItemContentPipe, AllowsViewingItemInfoPipe } from 'src/app/models/item-view-permission';
import { PermissionsEditDialogComponent } from '../permissions-edit-dialog/permissions-edit-dialog.component';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { SectionHeaderComponent } from 'src/app/ui-components/section-header/section-header.component';
import { SectionParagraphComponent } from 'src/app/ui-components/section-paragraph/section-paragraph.component';
import { NgIf, I18nSelectPipe, NgClass } from '@angular/common';

@Component({
  selector: 'alg-item-permissions',
  templateUrl: './item-permissions.component.html',
  styleUrls: [ './item-permissions.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    SectionParagraphComponent,
    SectionHeaderComponent,
    ProgressSelectComponent,
    FormsModule,
    TooltipModule,
    ButtonModule,
    PermissionsEditDialogComponent,
    I18nSelectPipe,
    AllowsViewingItemContentPipe,
    AllowsViewingItemInfoPipe,
    NgClass,
  ],
})
export class ItemPermissionsComponent implements OnChanges {
  @Output() changed = new EventEmitter<void>();

  @Input() itemData?: ItemData;
  @Input() watchedGroup?: WatchedGroup;

  canViewValues: ProgressSelectValue<string>[] = generateCanViewValues('Groups');
  isPermissionsDialogOpened = false;
  watchedGroupPermissions?: ItemCorePerm & ItemOwnerPerm & ItemSessionPerm;
  lockEdit?: 'content' | 'group' | 'contentGroup';
  collapsed = false;

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
