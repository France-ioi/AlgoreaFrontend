import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';
import { GroupData, GroupDataSource } from '../../services/group-datasource.service';
import { RemoveGroupManagerService } from '../../http-services/remove-group-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { mapStateData } from '../../../../shared/operators/state';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { ConfirmationService } from 'primeng/api';
import { displayGroupManagerRemovalResponseToast } from './group-manager-removal-response-handling';
import { DataPager } from 'src/app/shared/helpers/data-pager';

const managersLimit = 25;

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ]
})
export class GroupManagerListComponent implements OnChanges {

  @Input() groupData?: GroupData;

  selection: Manager[] = [];
  removalInProgress = false;
  isPermissionsEditDialogOpened = false;
  dialogManager?: Manager & { canManageAsText: string };

  /* eslint-disable @typescript-eslint/explicit-function-return-type */
  readonly datapager = new DataPager({
    fetch: ({ groupId }: { groupId: string }, lastManager?: Manager) =>
      this.getGroupManagersService.getGroupManagers(groupId, [], managersLimit, lastManager?.id),
    batchSize: managersLimit,
    dataToList: data => data,
    listToData: (_data, list) => list,
    onLoadMoreError: () => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
    /* eslint-enable @typescript-eslint/explicit-function-return-type */
  });

  readonly state$ = this.datapager.state$.pipe(
    mapStateData(managers => managers.map(manager => ({
      ...manager,
      canManageAsText: this.getManagerLevel(manager),
    }))),
  );

  constructor(
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private groupDataSource: GroupDataSource,
    private userService: UserSessionService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.groupData) {
      (changes.groupData?.previousValue as GroupData | undefined)?.group.id !== this.groupData?.group.id
        ? this.reloadData()
        : this.fetchData();
    }
  }

  private getManagerLevel(manager: Manager): string {
    switch (manager.canManage) {
      case 'none':
        return $localize`Read-only`;
      case 'memberships':
        return $localize`Memberships`;
      case 'memberships_and_group':
        return $localize`Memberships and group`;
    }
  }

  reloadData(): void {
    this.datapager.reset();
    this.fetchData();
  }
  fetchData(): void {
    if (!this.groupData) throw new Error('unexpected');
    this.datapager.load({ groupId: this.groupData.group.id });
  }

  onSelectAll(managers: Manager[]): void {
    if (this.selection.length === managers.length) {
      this.selection = [];
      return;
    }
    this.selection = managers;
  }

  onRemove(event: Event): void {
    if (this.selection.length === 0) {
      return;
    }

    const currentUserId = this.userService.session$.getValue()?.user.groupId;

    if (!currentUserId) {
      throw new Error('Unexpected: Missed current user ID');
    }

    if (this.selection.some(manager => manager.id === currentUserId)) {
      this.confirmationService.confirm({
        target: event.target || undefined,
        key: 'commonPopup',
        icon: 'pi pi-exclamation-triangle',
        message: $localize`Are you sure to remove yourself from the managers of this group? You may lose manager access and
          not be able to restore it.`,
        acceptLabel: $localize`Yes, remove me from the group managers`,
        acceptButtonStyleClass: 'p-button-danger',
        acceptIcon: 'fa fa-check',
        rejectLabel: $localize`No`,
        accept: () => this.remove(),
      });

      return;
    }

    this.remove();
  }

  remove(): void {
    if (!this.groupData) {
      throw new Error('Unexpected: Missed groupData');
    }

    const currentUserId = this.userService.session$.getValue()?.user.groupId;

    if (!currentUserId) {
      throw new Error('Unexpected: Missed current user ID');
    }

    const groupId = this.groupData.group.id;
    const ownManagerId = this.selection.find(manager => manager.id === currentUserId)?.id;

    this.removalInProgress = true;

    this.removeGroupManagerService.removeBatch(
      groupId,
      this.selection.filter(manager => manager.id !== ownManagerId).map(manager => manager.id),
      ownManagerId,
    )
      .subscribe({
        next: result => {
          displayGroupManagerRemovalResponseToast(this.actionFeedbackService, result);
          this.removalInProgress = false;

          if (result.countSuccess > 0) {
            this.selection = [];
            this.reloadData();
          }
        },
        error: () => {
          this.removalInProgress = false;
          this.actionFeedbackService.unexpectedError();
        }
      });
  }

  openPermissionsEditDialog(manager: Manager & { canManageAsText: string }): void {
    this.isPermissionsEditDialogOpened = true;
    this.dialogManager = manager;
  }

  closePermissionsEditDialog(event: { updated: boolean }): void {
    this.isPermissionsEditDialogOpened = false;
    this.dialogManager = undefined;

    if (event.updated) {
      this.reloadData();
      this.groupDataSource.refetchGroup();
    }
  }

  onAdded(): void {
    this.reloadData();
  }
}
