import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GetGroupManagersService, Manager } from '../../http-services/get-group-managers.service';
import { GroupData, GroupDataSource } from '../../services/group-datasource.service';
import { RemoveGroupManagerService } from '../../http-services/remove-group-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { ReplaySubject, Subject } from 'rxjs';
import { switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { ConfirmationService } from 'primeng/api';
import { displayGroupManagerRemovalResponseToast } from './group-manager-removal-response-handling';

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ]
})
export class GroupManagerListComponent implements OnChanges, OnDestroy {

  @Input() groupData?: GroupData;

  selection: Manager[] = [];
  removalInProgress = false;
  isPermissionsEditDialogOpened = false;
  dialogManager?: Manager & { canManageAsText: string };

  private refresh$ = new Subject<void>();
  private readonly groupId$ = new ReplaySubject<string>(1);
  readonly state$ = this.groupId$.pipe(
    distinctUntilChanged(),
    switchMap(id => this.getGroupManagersService.getGroupManagers(id).pipe(
      map(managers => managers.map(manager => ({
        ...manager,
        canManageAsText: this.getManagerLevel(manager),
      }))),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private groupDataSource: GroupDataSource,
    private userService: UserSessionService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.groupData) {
      this.groupId$.next(this.groupData.group.id);
    }
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.groupId$.complete();
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
    this.refresh$.next();
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

    if (this.selection.some(manager => manager.id === currentUserId)) {
      const foundIndex = this.selection.findIndex(manager => manager.id === currentUserId);
      const currentUser = this.selection.splice(foundIndex, 1);
      this.selection = [ ...this.selection, ...currentUser ];
    }

    const groupId = this.groupData.group.id;

    this.removalInProgress = true;

    this.removeGroupManagerService.removeBatch(groupId, this.selection.map(manager => manager.id))
      .subscribe({
        next: response => {
          displayGroupManagerRemovalResponseToast(this.actionFeedbackService, response);
          this.removalInProgress = false;
          this.selection = [];
          this.reloadData();
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
}
