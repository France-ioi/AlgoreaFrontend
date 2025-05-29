import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { GetGroupManagersService, Manager } from '../../data-access/get-group-managers.service';
import { RemoveGroupManagerService } from '../../data-access/remove-group-manager.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { mapStateData } from 'src/app/utils/operators/state';
import { UserSessionService } from 'src/app/services/user-session.service';
import { displayGroupManagerRemovalResponseToast } from './group-manager-removal-response-handling';
import { DataPager } from 'src/app/utils/data-pager';
import { HttpErrorResponse } from '@angular/common/http';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { ManagerPermissionDialogComponent } from '../manager-permission-dialog/manager-permission-dialog.component';
import { GroupManagerAddComponent } from '../group-manager-add/group-manager-add.component';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { GridComponent } from 'src/app/ui-components/grid/grid.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { GroupData } from '../../models/group-data';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { filter } from 'rxjs/operators';

const managersLimit = 25;

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ],
  standalone: true,
  imports: [
    LoadingComponent,
    ErrorComponent,
    GridComponent,
    TableModule,
    RouterLink,
    NgClass,
    GroupManagerAddComponent,
    ManagerPermissionDialogComponent,
    AsyncPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    ButtonIconComponent,
    ButtonComponent
  ],
})
export class GroupManagerListComponent implements OnChanges {

  @Input({ required: true }) groupData!: GroupData;

  selection: Manager[] = [];
  removalInProgress = false;
  isPermissionsEditDialogOpened = false;
  dialogManager?: Manager & { canManageAsText: string };

  readonly datapager = new DataPager({
    fetch: (pageSize, latestManager?: Manager): Observable<Manager[]> =>
      this.getGroupManagersService.getGroupManagers(this.groupData.group.id, { limit: pageSize, fromId: latestManager?.id }),
    pageSize: managersLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
  });

  readonly state$ = this.datapager.list$.pipe(
    mapStateData(managers => managers.map(manager => ({
      ...manager,
      canManageAsText: this.getManagerLevel(manager),
    }))),
  );

  constructor(
    private store: Store,
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private userService: UserSessionService,
    private confirmationModalService: ConfirmationModalService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    (changes.groupData?.previousValue as GroupData | undefined)?.group.id !== this.groupData.group.id
      ? this.fetchData()
      : this.fetchMoreData();
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

  fetchData(): void {
    this.datapager.reset();
    this.fetchMoreData();
  }
  fetchMoreData(): void {
    this.datapager.load();
  }

  onSelectAll(managers: Manager[]): void {
    if (this.selection.length === managers.length) {
      this.selection = [];
      return;
    }
    this.selection = managers;
  }

  onRemove(): void {
    if (this.selection.length === 0) {
      return;
    }

    const currentUserId = this.userService.session$.getValue()?.groupId;

    if (!currentUserId) {
      throw new Error('Unexpected: Missed current user ID');
    }

    this.remove();
  }

  remove(): void {
    const currentUserId = this.userService.session$.getValue()?.groupId;

    if (!currentUserId) {
      throw new Error('Unexpected: Missed current user ID');
    }

    const groupId = this.groupData.group.id;
    const ownManagerId = this.selection.find(manager => manager.id === currentUserId)?.id;

    this.removalInProgress = true;

    const proceedRemoving$: Observable<true | undefined> = ownManagerId ? this.confirmationModalService.open({
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
      message: $localize`Are you sure to remove yourself from the managers of this group? You may lose manager access and
          not be able to restore it.`,
      acceptButtonCaption: $localize`Yes, remove me from the group managers`,
      acceptButtonStyleClass: 'danger',
      acceptButtonIcon: 'ph-bold ph-check',
    }, { maxWidth: '34rem' }).pipe(filter(accepted => !!accepted)) : of(undefined);

    proceedRemoving$.pipe(
      switchMap(() =>
        this.removeGroupManagerService.removeBatch(
          groupId,
          this.selection.filter(manager => manager.id !== ownManagerId).map(manager => manager.id),
          ownManagerId,
        )
      )
    ).subscribe({
      next: result => {
        displayGroupManagerRemovalResponseToast(this.actionFeedbackService, result);
        this.removalInProgress = false;

        if (result.countSuccess > 0) {
          this.selection = [];
          this.fetchData();
        }
      },
      error: err => {
        this.removalInProgress = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
      complete: () => this.removalInProgress = false,
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
      this.fetchData();
      this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    }
  }

  onAdded(): void {
    this.fetchData();
  }
}
