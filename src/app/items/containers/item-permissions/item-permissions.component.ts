import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { ItemData } from '../../models/item-data';
import {
  ProgressSelectValue,
  ProgressSelectComponent,
} from 'src/app/ui-components/collapsible-section/progress-select/progress-select.component';
import {
  generateCanEditValues,
  generateCanGrantViewValues,
  generateCanViewValues,
  generateCanWatchValues
} from '../../models/permissions-texts';
import { allowsGivingPermToItem, ItemCorePerm, ItemOwnerPerm, ItemSessionPerm } from 'src/app/items/models/item-permissions';
import { AllowsViewingItemContentPipe, AllowsViewingItemInfoPipe, ItemViewPerm } from 'src/app/items/models/item-view-permission';
import {
  PermissionsEditDialogComponent,
  PermissionsEditDialogParams,
} from '../permissions-edit-dialog/permissions-edit-dialog.component';
import { FormsModule } from '@angular/forms';
import { SectionHeaderComponent } from 'src/app/ui-components/section-header/section-header.component';
import { I18nSelectPipe, NgClass } from '@angular/common';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { AllowsGrantingContentViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { HttpErrorResponse } from '@angular/common/http';
import { GroupPermissionsService } from 'src/app/data-access/group-permissions.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Dialog } from '@angular/cdk/dialog';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-item-permissions',
  templateUrl: './item-permissions.component.html',
  styleUrls: [ './item-permissions.component.scss' ],
  imports: [
    SectionHeaderComponent,
    ProgressSelectComponent,
    FormsModule,
    I18nSelectPipe,
    AllowsViewingItemContentPipe,
    AllowsViewingItemInfoPipe,
    NgClass,
    GroupIsUserPipe,
    AllowsGrantingContentViewItemPipe,
    ButtonComponent,
    TooltipDirective,
  ]
})
export class ItemPermissionsComponent implements OnChanges {
  @Output() changed = new EventEmitter<void>();

  @Input() itemData?: ItemData;
  @Input() observedGroup?: { route: RawGroupRoute, name: string, currentUserCanGrantAccess: boolean };

  private dialogService = inject(Dialog);

  canViewValues: ProgressSelectValue<string>[] = generateCanViewValues('Groups');
  canGrantViewValues: ProgressSelectValue<string>[] = generateCanGrantViewValues('Groups');
  canWatchValues: ProgressSelectValue<string>[] = generateCanWatchValues('Groups');
  canEditValues: ProgressSelectValue<string>[] = generateCanEditValues('Groups');
  watchedGroupPermissions?: ItemCorePerm & ItemOwnerPerm & ItemSessionPerm;
  lockEdit?: 'content' | 'group' | 'contentGroup';
  collapsed = true;
  lockEditTooltipCaptions = {
    content: $localize`You are not allowed to give permissions on this content`,
    group: $localize`You are not allowed to give permissions to this group`,
    contentGroup: $localize`You are not allowed to give permissions on this content and to this group`,
  };
  updateInProcess = false;

  constructor(
    private groupPermissionsService: GroupPermissionsService,
    private actionFeedbackService: ActionFeedbackService,
    private currentContentService: CurrentContentService,
  ) {}

  ngOnChanges(): void {
    this.watchedGroupPermissions = this.itemData?.item?.watchedGroup?.permissions ? {
      ...this.itemData.item.watchedGroup.permissions,
      canMakeSessionOfficial: false,
    } : undefined;

    const currentUserCanGrantAccess = this.observedGroup?.currentUserCanGrantAccess;
    const currentUserCanGivePermissions = this.itemData && allowsGivingPermToItem(this.itemData.item.permissions);

    this.lockEdit = currentUserCanGrantAccess && !currentUserCanGivePermissions ? 'content' :
      !currentUserCanGrantAccess && currentUserCanGivePermissions ? 'group' :
        !currentUserCanGrantAccess && !currentUserCanGivePermissions ? 'contentGroup' : undefined;
  }

  openPermissionsDialog(): void {
    if (!this.itemData) throw new Error('Unexpected: missed item data');
    if (!this.observedGroup) throw new Error('Unexpected: missed observed group');
    this.dialogService.open<boolean, PermissionsEditDialogParams>(PermissionsEditDialogComponent, {
      data: {
        currentUserPermissions: this.itemData.item.permissions,
        item: this.itemData.item,
        group: this.observedGroup.route,
        permReceiverName: this.observedGroup.name,
      },
      disableClose: true,
    }).closed.subscribe(changed => {
      if (changed) {
        this.changed.emit();
      }
    });
  }

  grantViewContentAccess(): void {
    const groupId = this.observedGroup?.route.id;
    if (!groupId) throw new Error('Unexpected: The group id is not provided');
    const itemId = this.itemData?.item.id;
    if (!itemId) throw new Error('Unexpected: The item id is not provided');

    this.updateInProcess = true;
    this.groupPermissionsService.updatePermissions(
      groupId,
      groupId,
      itemId,
      { canView: ItemViewPerm.Content },
    )
      .subscribe({
        next: () => {
          this.updateInProcess = false;
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
          this.changed.emit();
          this.currentContentService.forceNavMenuReload();
        },
        error: err => {
          this.updateInProcess = false;
          this.actionFeedbackService.unexpectedError();
          this.currentContentService.forceNavMenuReload();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }
}
