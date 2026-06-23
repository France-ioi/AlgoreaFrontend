import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { I18nSelectPipe } from '@angular/common';
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
  styleUrl: './item-permissions.component.scss',
  imports: [
    SectionHeaderComponent,
    ProgressSelectComponent,
    FormsModule,
    I18nSelectPipe,
    AllowsViewingItemContentPipe,
    AllowsViewingItemInfoPipe,
    GroupIsUserPipe,
    AllowsGrantingContentViewItemPipe,
    ButtonComponent,
    TooltipDirective,
  ]
})
export class ItemPermissionsComponent {
  private groupPermissionsService = inject(GroupPermissionsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private currentContentService = inject(CurrentContentService);
  private dialogService = inject(Dialog);
  private destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();
  observedGroup = input.required<{ route: RawGroupRoute, name: string, currentUserCanGrantAccess: boolean }>();
  changed = output<void>();

  canViewValues: ProgressSelectValue<string>[] = generateCanViewValues('Groups');
  canGrantViewValues: ProgressSelectValue<string>[] = generateCanGrantViewValues('Groups');
  canWatchValues: ProgressSelectValue<string>[] = generateCanWatchValues('Groups');
  canEditValues: ProgressSelectValue<string>[] = generateCanEditValues('Groups');
  collapsed = signal(true);
  updateInProcess = signal(false);
  lockEditTooltipCaptions = {
    content: $localize`You are not allowed to give permissions on this content`,
    group: $localize`You are not allowed to give permissions to this group`,
    contentGroup: $localize`You are not allowed to give permissions on this content and to this group`,
  };

  protected readonly watchedGroupPermissions = computed((): (ItemCorePerm & ItemOwnerPerm & ItemSessionPerm) | undefined => {
    const itemData = this.itemData();
    return itemData.item?.watchedGroup?.permissions ? {
      ...itemData.item.watchedGroup.permissions,
      canMakeSessionOfficial: false,
    } : undefined;
  });

  protected readonly lockEdit = computed((): 'content' | 'group' | 'contentGroup' | undefined => {
    const observedGroup = this.observedGroup();
    const itemData = this.itemData();
    const currentUserCanGrantAccess = observedGroup.currentUserCanGrantAccess;
    const currentUserCanGivePermissions = allowsGivingPermToItem(itemData.item.permissions);

    if (currentUserCanGrantAccess && !currentUserCanGivePermissions) return 'content';
    if (!currentUserCanGrantAccess && currentUserCanGivePermissions) return 'group';
    if (!currentUserCanGrantAccess && !currentUserCanGivePermissions) return 'contentGroup';
    return undefined;
  });

  openPermissionsDialog(): void {
    this.dialogService.open<boolean, PermissionsEditDialogParams>(PermissionsEditDialogComponent, {
      data: {
        currentUserPermissions: this.itemData().item.permissions,
        item: this.itemData().item,
        group: this.observedGroup().route,
        permReceiverName: this.observedGroup().name,
      },
      disableClose: true,
    }).closed.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(changed => {
      if (changed) {
        this.changed.emit();
      }
    });
  }

  grantViewContentAccess(): void {
    const groupId = this.observedGroup().route.id;
    const itemId = this.itemData().item.id;

    this.updateInProcess.set(true);
    this.groupPermissionsService.updatePermissions(
      groupId,
      groupId,
      itemId,
      { canView: ItemViewPerm.Content },
    )
      .subscribe({
        next: () => {
          this.updateInProcess.set(false);
          this.actionFeedbackService.success($localize`:@@permissionsUpdated:Permissions successfully updated.`);
          this.changed.emit();
          this.currentContentService.forceNavMenuReload();
        },
        error: err => {
          this.updateInProcess.set(false);
          this.actionFeedbackService.unexpectedError();
          this.currentContentService.forceNavMenuReload();
          if (!(err instanceof HttpErrorResponse)) throw err;
        },
      });
  }
}
