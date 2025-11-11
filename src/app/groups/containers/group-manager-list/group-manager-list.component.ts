import { Component, computed, effect, input } from '@angular/core';
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
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromGroupContent } from '../../store';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import {
  canCurrentUserManageMembersAndGroup,
  CanCurrentUserManageMembersAndGroupPipe,
  CompareManagershipLevelPipe
} from '../../models/group-management';
import { Group } from '../../models/group';
import { ManagementLevelAsTextPipe } from './management-level-as-text.pipe';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { filter } from 'rxjs/operators';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow, CdkHeaderRowDef,
  CdkRow,
  CdkRowDef,
  CdkTable
} from '@angular/cdk/table';
import { FindInArray } from 'src/app/pipes/findInArray';

const managersLimit = 25;

@Component({
  selector: 'alg-group-manager-list',
  templateUrl: './group-manager-list.component.html',
  styleUrls: [ './group-manager-list.component.scss' ],
  standalone: true,
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    GroupManagerAddComponent,
    ManagerPermissionDialogComponent,
    AsyncPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    ButtonIconComponent,
    ButtonComponent,
    CanCurrentUserManageMembersAndGroupPipe,
    ManagementLevelAsTextPipe,
    CompareManagershipLevelPipe,
    CdkTable,
    CdkRow,
    CdkRowDef,
    CdkCell,
    CdkCellDef,
    CdkColumnDef,
    CdkHeaderCell,
    FindInArray,
    CdkHeaderCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
  ],
})
export class GroupManagerListComponent {

  group = input.required<Group>();

  selection: Manager[] = [];
  removalInProgress = false;
  editingManager?: Manager; // the manager being edited in the dialog, undefined when the dialog is closed

  readonly datapager = new DataPager({
    fetch: (pageSize, latestManager?: Manager): Observable<Manager[]> => this.getGroupManagersService.getGroupManagers(
      this.group().id,
      { limit: pageSize, fromId: latestManager?.id, includeAncestors: true }
    ),
    pageSize: managersLimit,
    onLoadMoreError: (): void => {
      this.actionFeedbackService.error($localize`Could not load more results, are you connected to the internet?`);
    },
  });

  readonly state$ = this.datapager.list$.pipe(
    mapStateData(managers => ({
      allManagers: managers,
      currentGroupManagers: managers.filter(m => m.canManage !== null)
    })),
  );

  displayedColumns = computed(() => [
    ...(canCurrentUserManageMembersAndGroup(this.group()) ? [ 'checkbox' ] : []),
    'name',
    'canManage',
    'canGrantGroupAccess',
    'canWatchMembers',
    'operations',
  ]);

  constructor(
    private store: Store,
    private getGroupManagersService: GetGroupManagersService,
    private removeGroupManagerService: RemoveGroupManagerService,
    private actionFeedbackService: ActionFeedbackService,
    private userService: UserSessionService,
    private confirmationModalService: ConfirmationModalService,
  ) {
    effect(() => {
      this.fetchData();
    });
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

  onSelect(item: Manager): void {
    if (this.selection.includes(item)) {
      const idx = this.selection.indexOf(item);
      this.selection = [
        ...this.selection.slice(0, idx),
        ...this.selection.slice(idx + 1),
      ];
    } else {
      this.selection = [ ...this.selection, item ];
    }
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

    const groupId = this.group().id;
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

  openPermissionsEditDialog(manager: Manager): void {
    this.editingManager = manager;
  }

  closePermissionsEditDialog(event: { updated: boolean }): void {
    this.editingManager = undefined;

    if (event.updated) {
      this.fetchData();
      this.store.dispatch(fromGroupContent.groupPageActions.refresh());
    }
  }

  onAdded(): void {
    this.fetchData();
  }
}
